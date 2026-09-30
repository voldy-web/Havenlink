import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { HttpError } from '../utils/errors.js'
import { pool } from '../db/pool.js'

export const signToken = (user) => jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' })

// The shape of a user we send to the browser. NEVER includes the password hash.
export const publicUser = (row) => ({
  id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role, createdAt: row.created_at,
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
  req.user = rows[0]
  next()
}
