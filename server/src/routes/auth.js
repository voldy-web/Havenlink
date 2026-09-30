import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { config } from '../config.js'
import { pool } from '../db/pool.js'
import { HttpError } from '../utils/errors.js'
import { checkName, checkEmail, checkPhone, checkNewPassword, checkRole, clean } from '../utils/validate.js'
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

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

export default router
