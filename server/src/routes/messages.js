// Messages for the signed-in user. Every query is limited to conversations
// the caller owns (user_id = req.user.id), so nobody can read another person's chat.
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

const toConversation = (r) => ({
  id: r.id, kind: r.kind, counterpartId: r.counterpart_id, counterpartName: r.counterpart_name,
  subject: r.subject, propertyId: r.property_id, createdAt: r.created_at, lastMessageAt: r.last_message_at,
})
const toMessage = (m) => ({ id: m.id, fromMe: m.from_me, body: m.body, createdAt: m.created_at })

// Finds one of the caller's conversations, or answers 404 (also for an id that is not a uuid).
async function ownConversation(db, id, userId, lock = false) {
  if (!UUID.test(id)) throw new HttpError(404, 'Conversation not found.')
  const { rows } = await db.query(`select * from conversations where id = $1 and user_id = $2${lock ? ' for update' : ''}`, [id, userId])
  if (!rows[0]) throw new HttpError(404, 'Conversation not found.')
  return rows[0]
}

const checkBody = (v) => (isText(v, 1, 2000) ? null : 'Write a message of up to 2,000 characters.')

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `select c.*,
       (select body from messages m where m.conversation_id = c.id order by m.created_at desc, m.id desc limit 1) as last_body,
       (select from_me from messages m where m.conversation_id = c.id order by m.created_at desc, m.id desc limit 1) as last_from_me,
       (select count(*)::int from messages m where m.conversation_id = c.id and not m.from_me and m.read_at is null) as unread
     from conversations c where c.user_id = $1 order by c.last_message_at desc`,
    [req.user.id],
  )
  res.json({ conversations: rows.map((r) => ({ ...toConversation(r), lastBody: r.last_body, lastFromMe: r.last_from_me, unread: r.unread })) })
})

router.post('/', sendLimiter, async (req, res) => {
  const b = req.body ?? {}
  const isAgent = b.kind === 'agent'
  if (!isAgent && b.kind !== 'support') throw new HttpError(400, 'Please check your message and try again.', { kind: 'Choose who to message.' })
  failIfInvalid({
    subject: isText(b.subject, 3, 120) ? null : 'Add a short subject (3 to 120 characters).',
    body: checkBody(b.body),
    ...(isAgent && {
      counterpartId: isInt(b.counterpartId, 1, 1_000_000) ? null : 'Choose an agent.',
      counterpartName: isText(b.counterpartName, 2, 80) ? null : 'Choose an agent.',
      propertyId: b.propertyId === undefined || b.propertyId === null || isInt(b.propertyId, 1, 1_000_000) ? null : 'That home is not valid.',
    }),
  })

  const row = await withTransaction(async (db) => {
    const count = (await db.query('select count(*)::int as n from conversations where user_id = $1', [req.user.id])).rows[0].n
    if (count >= MAX_CONVERSATIONS) throw new HttpError(400, 'You have reached the limit of open conversations.')
    const { rows } = await db.query(
      `insert into conversations (user_id, kind, counterpart_id, counterpart_name, subject, property_id)
       values ($1, $2, $3, $4, $5, $6) returning *`,
      [req.user.id, b.kind, isAgent ? b.counterpartId : null, isAgent ? b.counterpartName.trim() : SUPPORT_NAME, b.subject.trim(), isAgent ? b.propertyId ?? null : null],
    )
    await db.query('insert into messages (conversation_id, from_me, body, read_at) values ($1, true, $2, now())', [rows[0].id, b.body.trim()])
    return rows[0]
  })
  res.status(201).json({ conversation: toConversation(row) })
})

// Opens a conversation and marks what the other side sent as read.
router.get('/:id', async (req, res) => {
  const conversation = await ownConversation(pool, req.params.id, req.user.id)
  await pool.query('update messages set read_at = now() where conversation_id = $1 and not from_me and read_at is null', [conversation.id])
  const { rows } = await pool.query('select id::int, from_me, body, created_at from messages where conversation_id = $1 order by created_at, id', [conversation.id])
  res.json({ conversation: toConversation(conversation), messages: rows.map(toMessage) })
})

router.post('/:id/messages', sendLimiter, async (req, res) => {
  failIfInvalid({ body: checkBody(req.body?.body) })
  const message = await withTransaction(async (db) => {
    const conversation = await ownConversation(db, req.params.id, req.user.id, true)
    const count = (await db.query('select count(*)::int as n from messages where conversation_id = $1', [conversation.id])).rows[0].n
    if (count >= MAX_MESSAGES) throw new HttpError(400, 'This conversation is full. Please start a new one.')
    const { rows } = await db.query(
      'insert into messages (conversation_id, from_me, body, read_at) values ($1, true, $2, now()) returning id::int, from_me, body, created_at',
      [conversation.id, req.body.body.trim()],
    )
    await db.query('update conversations set last_message_at = now() where id = $1', [conversation.id])
    return rows[0]
  })
  res.status(201).json({ message: toMessage(message) })
})

// TESTING ONLY (needs DEMO_TOOLS=true): adds a reply from the other side, standing
// in for the agent and support teams that cannot sign in yet.
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
    const theirs = (await db.query('select count(*)::int as n from messages where conversation_id = $1 and not from_me', [conversation.id])).rows[0].n
    const list = replies[conversation.kind]
    const { rows } = await db.query(
      'insert into messages (conversation_id, from_me, body) values ($1, false, $2) returning id::int, from_me, body, created_at',
      [conversation.id, list[theirs % list.length]],
    )
    await db.query('update conversations set last_message_at = now() where id = $1', [conversation.id])
    return rows[0]
  })
  res.status(201).json({ message: toMessage(message) })
})

export default router
