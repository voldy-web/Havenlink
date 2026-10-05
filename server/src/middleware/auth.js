import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { HttpError } from '../utils/errors.js'
import { pool } from '../db/pool.js'

export const signToken = (user) => jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' })

// The shape of a user we send to the browser. NEVER includes the password hash.
export const publicUser = (row) => ({
  id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role, createdAt: row.created_at,
  emergencyName: row.emergency_name, emergencyPhone: row.emergency_phone, privacy: row.privacy,
  hasPassword: Boolean(row.password_hash), // Google-only accounts have none until they choose one
})

// Protects a route: needs "Authorization: Bearer <token>". Puts the user on req.user.
export async function requireAuth(req, _res, next) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) throw new HttpError(401, 'Please sign in.')
  let payload
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] })
  } catch {
    throw new HttpError(401, 'Your session has expired. Please sign in again.')
  }
  const { rows } = await pool.query('select * from users where id = $1', [payload.sub])
  if (!rows[0]) throw new HttpError(401, 'Please sign in.')
  // A password change signs out every older login (tokens store when they were issued).
  if (payload.iat < Math.floor(new Date(rows[0].password_changed_at).getTime() / 1000)) {
    throw new HttpError(401, 'Your session has expired. Please sign in again.')
  }
  req.user = rows[0]
  next()
}

// Protects a route so only some roles may use it, for example requireRole('owner').
// Use it AFTER requireAuth.
export const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) throw new HttpError(403, 'Your account type cannot do this.')
  next()
}
