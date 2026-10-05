// Messages for the signed-in user. A conversation has two sides: the person who started it
// (conversations.user_id) and, for homes posted by an owner, that owner (conversations.owner_id).
// Every query is limited to conversations the caller is part of, so nobody can read another person's chat.
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { config } from '../config.js'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/tx.js'
import { HttpError, failIfInvalid } from '../utils/errors.js'
import { isInt, isText } from '../utils/validate.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_CONVERSATIONS = 50
const MAX_MESSAGES = 500
const SUPPORT_NAME = 'Haven Link Support'

// Slows down message spam from one address.
const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.messageRateLimit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'You are sending messages too quickly. Please wait a moment.' },
})

// "Did I write this message?" Older messages have no sender: for those, from_me means
// "written by the person who started the conversation", and the caller is always that person.
const MINE = 'coalesce(m.sender_id = $1, m.from_me)'

// The conversation as the caller sees it: the other side's name is the owner (or agent/support)
// for the person who started it, and the starter's name for the owner.
const toConversation = (r, me) => ({
  id: r.id, kind: r.kind, youAre: r.user_id === me ? 'starter' : 'recipient',
  counterpartId: r.counterpart_id, counterpartName: r.user_id === me ? r.counterpart_name : r.starter_name,
  subject: r.subject, propertyId: r.property_id, createdAt: r.created_at, lastMessageAt: r.last_message_at,
})

// Finds one of the caller's conversations, or answers 404 (also for an id that is not a uuid).
async function ownConversation(db, id, me, lock = false) {
  if (!UUID.test(id)) throw new HttpError(404, 'Conversation not found.')
  const { rows } = await db.query(
    `select c.*, u.name as starter_name from conversations c join users u on u.id = c.user_id
     where c.id = $1 and (c.user_id = $2 or c.owner_id = $2)${lock ? ' for update of c' : ''}`,
    [id, me],
  )
  if (!rows[0]) throw new HttpError(404, 'Conversation not found.')
  return rows[0]
}

const checkBody = (v) => (isText(v, 1, 2000) ? null : 'Write a message of up to 2,000 characters.')

async function addMessage(db, conversation, me, body) {
  const count = (await db.query('select count(*)::int as n from messages where conversation_id = $1', [conversation.id])).rows[0].n
  if (count >= MAX_MESSAGES) throw new HttpError(400, 'This conversation is full. Please start a new one.')
  const { rows } = await db.query(
    'insert into messages (conversation_id, sender_id, from_me, body) values ($1, $2, $3, $4) returning id::int, body, created_at',
    [conversation.id, me, conversation.user_id === me, body.trim()],
  )
  await db.query('update conversations set last_message_at = now() where id = $1', [conversation.id])
  return { id: rows[0].id, fromMe: true, body: rows[0].body, createdAt: rows[0].created_at }
}

router.get('/', async (req, res) => {
  const me = req.user.id
  const { rows } = await pool.query(
    `select c.*, u.name as starter_name,
       (select body from messages m where m.conversation_id = c.id order by m.created_at desc, m.id desc limit 1) as last_body,
       (select ${MINE} from messages m where m.conversation_id = c.id order by m.created_at desc, m.id desc limit 1) as last_from_me,
       (select count(*)::int from messages m where m.conversation_id = c.id and m.read_at is null and not ${MINE}) as unread
     from conversations c join users u on u.id = c.user_id
     where c.user_id = $1 or c.owner_id = $1 order by c.last_message_at desc`,
    [me],
  )
  res.json({ conversations: rows.map((r) => ({ ...toConversation(r, me), lastBody: r.last_body, lastFromMe: r.last_from_me, unread: r.unread })) })
})

router.post('/', sendLimiter, async (req, res) => {
  const b = req.body ?? {}
  const me = req.user.id
  if (!['agent', 'support', 'owner'].includes(b.kind)) throw new HttpError(400, 'Please check your message and try again.', { kind: 'Choose who to message.' })
  const isAgent = b.kind === 'agent'
  const isOwner = b.kind === 'owner'
  failIfInvalid({
    subject: isText(b.subject, 3, 120) ? null : 'Add a short subject (3 to 120 characters).',
    body: checkBody(b.body),
    ...(isAgent && {
      counterpartId: isInt(b.counterpartId, 1, 1_000_000) ? null : 'Choose an agent.',
      counterpartName: isText(b.counterpartName, 2, 80) ? null : 'Choose an agent.',
      propertyId: b.propertyId === undefined || b.propertyId === null || isInt(b.propertyId, 1, 1_000_000) ? null : 'That home is not valid.',
    }),
    ...(isOwner && { propertyId: isInt(b.propertyId, 1, 2_000_000_000) ? null : 'Choose a home.' }),
  })

  const { row, existing } = await withTransaction(async (db) => {
    if (isOwner) {
      // Only approved homes posted by an owner can be messaged this way (the starter homes use their agents).
      const home = (await db.query("select owner_id from properties where id = $1 and source = 'owner' and review_status = 'approved'", [b.propertyId])).rows[0]
      if (!home?.owner_id) throw new HttpError(400, 'Please check your message and try again.', { propertyId: 'This home cannot receive messages here.' })
      if (home.owner_id === me) throw new HttpError(400, 'This is your own listing.')
      // One conversation per person and home: a second message goes into the same conversation.
      const found = (await db.query('select * from conversations where user_id = $1 and owner_id = $2 and property_id = $3 for update', [me, home.owner_id, b.propertyId])).rows[0]
      if (found) {
        await addMessage(db, found, me, b.body)
        return { row: found, existing: true }
      }
    }
    const count = (await db.query('select count(*)::int as n from conversations where user_id = $1', [me])).rows[0].n
    if (count >= MAX_CONVERSATIONS) throw new HttpError(400, 'You have reached the limit of open conversations.')
    const owner = isOwner ? (await db.query("select owner_id, (select name from users where id = owner_id) as name from properties where id = $1", [b.propertyId])).rows[0] : null
    const { rows } = await db.query(
      `insert into conversations (user_id, kind, counterpart_id, counterpart_name, subject, property_id, owner_id)
       values ($1, $2, $3, $4, $5, $6, $7) returning *`,
      [me, b.kind, isAgent ? b.counterpartId : null, isOwner ? owner.name : isAgent ? b.counterpartName.trim() : SUPPORT_NAME,
        b.subject.trim(), isAgent || isOwner ? b.propertyId ?? null : null, isOwner ? owner.owner_id : null],
    )
    await addMessage(db, rows[0], me, b.body)
    return { row: rows[0], existing: false }
  })
  res.status(existing ? 200 : 201).json({ conversation: toConversation({ ...row, starter_name: req.user.name }, me) })
})

// Opens a conversation and marks what the other side wrote as read.
router.get('/:id', async (req, res) => {
  const me = req.user.id
  const conversation = await ownConversation(pool, req.params.id, me)
  await pool.query(`update messages m set read_at = now() where m.conversation_id = $2 and m.read_at is null and not ${MINE}`, [me, conversation.id])
  const { rows } = await pool.query(
    `select m.id::int, ${MINE} as mine, m.body, m.created_at from messages m where m.conversation_id = $2 order by m.created_at, m.id`,
    [me, conversation.id],
  )
  res.json({
    conversation: toConversation(conversation, me),
    messages: rows.map((m) => ({ id: m.id, fromMe: m.mine, body: m.body, createdAt: m.created_at })),
  })
})

router.post('/:id/messages', sendLimiter, async (req, res) => {
  failIfInvalid({ body: checkBody(req.body?.body) })
  const message = await withTransaction(async (db) => addMessage(db, await ownConversation(db, req.params.id, req.user.id, true), req.user.id, req.body.body))
  res.status(201).json({ message })
})

// TESTING ONLY (needs DEMO_TOOLS=true): adds a reply from the other side of a conversation with a
// sample agent or with support, who cannot sign in. Conversations with a real owner never use it.
const replies = {
  agent: [
    'Hello, thanks for your interest in the property. It is still available. Would you like to book a viewing?',
    'Of course. I can show you around this week. Which day and time suit you best?',
    'Thank you. I have noted that down and will confirm shortly.',
  ],
  support: [
    'Hello, thanks for contacting Haven Link. How can we help?',
    'Thank you for the details. We are looking into it and will update you here.',
    'Is there anything else we can help you with?',
  ],
}
router.post('/:id/demo-reply', async (req, res) => {
  if (!config.demoTools) throw new HttpError(403, 'Not available.')
  const message = await withTransaction(async (db) => {
    const conversation = await ownConversation(db, req.params.id, req.user.id, true)
    if (conversation.owner_id) throw new HttpError(400, 'A real person replies in this conversation.')
    const theirs = (await db.query('select count(*)::int as n from messages where conversation_id = $1 and not from_me', [conversation.id])).rows[0].n
    const list = replies[conversation.kind]
    const { rows } = await db.query(
      'insert into messages (conversation_id, from_me, body) values ($1, false, $2) returning id::int, from_me, body, created_at',
      [conversation.id, list[theirs % list.length]],
    )
    await db.query('update conversations set last_message_at = now() where id = $1', [conversation.id])
    return { id: rows[0].id, fromMe: false, body: rows[0].body, createdAt: rows[0].created_at }
  })
  res.status(201).json({ message })
})

export default router
