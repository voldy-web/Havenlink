import { createHash, randomBytes } from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { config } from '../config.js'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/tx.js'
import { sendMail } from '../utils/mailer.js'
import { verifyGoogleToken } from '../utils/google.js'
import { HttpError } from '../utils/errors.js'
import { ROLES_SELF_SERVE, checkName, checkEmail, checkPhone, checkNewPassword, checkRole, clean } from '../utils/validate.js'
import { publicUser, requireAuth, signToken } from '../middleware/auth.js'

const router = Router()

// Slows down people who try many passwords or spam sign-ups.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
})

// Compared against when an email is unknown, so a wrong email and a wrong
// password take the same time (this hides which emails have accounts).
const dummyHash = bcrypt.hashSync('not-a-real-password', 12)

router.post('/register', limiter, async (req, res) => {
  const { name, email, phone, role, password } = req.body ?? {}
  const fields = {
    name: checkName(name), email: checkEmail(email), phone: checkPhone(phone),
    role: checkRole(role), password: checkNewPassword(password),
  }
  const failed = Object.fromEntries(Object.entries(fields).filter(([, v]) => v))
  if (Object.keys(failed).length) throw new HttpError(400, 'Please check the highlighted fields.', failed)

  const hash = await bcrypt.hash(password, 12)
  try {
    const { rows } = await pool.query(
      'insert into users (name, email, phone, role, password_hash) values ($1, $2, $3, $4, $5) returning *',
      [clean.text(name), clean.email(email), clean.text(phone), role, hash],
    )
    res.status(201).json({ user: publicUser(rows[0]), token: signToken(rows[0]) })
  } catch (err) {
    if (err.code === '23505') throw new HttpError(409, 'An account with this email already exists. Please sign in instead.')
    throw err
  }
})

router.post('/login', limiter, async (req, res) => {
  const { email, password } = req.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') throw new HttpError(400, 'Enter your email and password.')

  const { rows } = await pool.query('select * from users where lower(email) = $1', [clean.email(email)])
  const ok = await bcrypt.compare(password, rows[0]?.password_hash ?? dummyHash)
  if (!rows[0] || !ok) throw new HttpError(401, 'Incorrect email or password.')
  res.json({ user: publicUser(rows[0]), token: signToken(rows[0]) })
})

// ---- Continue with Google ----
// The browser sends the token Google gave it; we verify it ourselves. Existing accounts are found by Google id
// first, then by (Google-verified) email. Linking an existing email account wipes its old password and signs it
// out everywhere: sign-ups are not email-verified yet, so someone else may have registered that address first.
router.post('/google', limiter, async (req, res) => {
  if (!config.googleClientId) throw new HttpError(503, 'Google sign-in is not set up on this site yet.')
  const { credential, role } = req.body ?? {}
  const g = await verifyGoogleToken(credential)

  const byGoogle = (await pool.query('select * from users where google_id = $1', [g.sub])).rows[0]
  if (byGoogle) return res.json({ user: publicUser(byGoogle), token: signToken(byGoogle) })

  const byEmail = (await pool.query('select * from users where lower(email) = $1', [clean.email(g.email)])).rows[0]
  if (byEmail) {
    if (byEmail.role === 'admin') throw new HttpError(403, 'Admin accounts sign in with their password.')
    const { rows } = await pool.query(
      `update users set google_id = $1, password_hash = null, password_changed_at = date_trunc('second', now()) where id = $2 returning *`,
      [g.sub, byEmail.id],
    )
    return res.json({ user: publicUser(rows[0]), token: signToken(rows[0]), linked: Boolean(byEmail.password_hash) })
  }

  if (role === undefined) throw new HttpError(404, 'There is no Haven Link account for this Google account yet. Create one first so you can choose your account type.', undefined, 'no_account')
  if (!ROLES_SELF_SERVE.includes(role)) throw new HttpError(400, 'Choose a valid account type.')
  const { rows } = await pool.query(
    "insert into users (name, email, phone, role, password_hash, google_id) values ($1, $2, '', $3, null, $4) returning *",
    [g.name.slice(0, 80), clean.email(g.email), role, g.sub],
  )
  res.status(201).json({ user: publicUser(rows[0]), token: signToken(rows[0]), created: true })
})

// ---- Forgotten password ----
const RESET_MINUTES = 60
const hashToken = (token) => createHash('sha256').update(token).digest('hex')

// Always answers the same way, so nobody can use this to find out which emails have accounts.
router.post('/forgot', limiter, async (req, res) => {
  const { email } = req.body ?? {}
  if (checkEmail(email)) throw new HttpError(400, 'Enter a valid email address.')
  const { rows } = await pool.query('select id, name, email from users where lower(email) = $1', [clean.email(email)])
  const user = rows[0]
  if (user) {
    const token = randomBytes(32).toString('hex')
    await pool.query('delete from password_resets where user_id = $1', [user.id])
    await pool.query(
      `insert into password_resets (user_id, token_hash, expires_at) values ($1, $2, now() + make_interval(mins => $3))`,
      [user.id, hashToken(token), RESET_MINUTES],
    )
    const link = `${config.appUrl}/reset-password?token=${token}`
    // A failure to send must not change the answer (that would reveal the account exists).
    sendMail({
      to: user.email,
      subject: 'Reset your Haven Link password',
      text: `Hi ${user.name.split(' ')[0]},\n\nSomeone asked to reset the password for your Haven Link account. To choose a new one, open this link within ${RESET_MINUTES} minutes:\n\n${link}\n\nIf this was not you, you can ignore this email. Your password stays the same.\n\nHaven Link`,
    }).catch((err) => console.error('Could not send reset email:', err.message))
  }
  res.json({ message: 'If an account exists for that email, we have sent a link to reset the password.' })
})

router.post('/reset', limiter, async (req, res) => {
  const { token, password } = req.body ?? {}
  const problem = checkNewPassword(password)
  if (problem) throw new HttpError(400, 'Please check the highlighted fields.', { password: problem })
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) throw new HttpError(400, 'This reset link is not valid. Ask for a new one.')
  const hash = await bcrypt.hash(password, 12)
  await withTransaction(async (db) => {
    const found = (await db.query(
      'select id, user_id from password_resets where token_hash = $1 and used_at is null and expires_at > now() for update',
      [hashToken(token)],
    )).rows[0]
    if (!found) throw new HttpError(400, 'This link has expired or was already used. Ask for a new one.')
    // password_changed_at signs out every older login.
    await db.query("update users set password_hash = $1, password_changed_at = date_trunc('second', now()) where id = $2", [hash, found.user_id])
    await db.query('delete from password_resets where user_id = $1', [found.user_id])
  })
  res.json({ message: 'Your password has been changed. You can sign in with it now.' })
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

export default router
