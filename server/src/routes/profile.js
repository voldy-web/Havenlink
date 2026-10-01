// Profile & settings for the signed-in user. Every route only touches the
// caller's own account (req.user.id), never anyone else's.
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/tx.js'
import { HttpError, failIfInvalid } from '../utils/errors.js'
import { checkName, checkPhone, checkNewPassword, clean } from '../utils/validate.js'
import { publicUser, requireAuth, signToken } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const PRIVACY_KEYS = ['maskContact', 'anonymousReviews', 'residentDirectory']

// Emergency contact fields are optional: blank is fine, otherwise check them.
const checkOptionalName = (v) => (v === '' ? null : checkName(v))
const checkOptionalPhone = (v) => (v === '' ? null : checkPhone(v))

router.patch('/profile', async (req, res) => {
  const body = req.body ?? {}
  const name = clean.text(body.name)
  const phone = clean.text(body.phone)
  const emergencyName = clean.text(body.emergencyName ?? '')
  const emergencyPhone = clean.text(body.emergencyPhone ?? '')
  failIfInvalid({
    name: checkName(name), phone: checkPhone(phone),
    emergencyName: checkOptionalName(emergencyName), emergencyPhone: checkOptionalPhone(emergencyPhone),
  })

  // Privacy: only the known on/off switches are accepted (true or false).
  let privacy = req.user.privacy
  if (body.privacy !== undefined) {
    const p = body.privacy
    if (typeof p !== 'object' || p === null || PRIVACY_KEYS.some((k) => typeof p[k] !== 'boolean')) {
      throw new HttpError(400, 'Please check your privacy choices.')
    }
    privacy = Object.fromEntries(PRIVACY_KEYS.map((k) => [k, p[k]]))
  }

  const { rows } = await pool.query(
    'update users set name = $1, phone = $2, emergency_name = $3, emergency_phone = $4, privacy = $5 where id = $6 returning *',
    [name, phone, emergencyName, emergencyPhone, JSON.stringify(privacy), req.user.id],
  )
  res.json({ user: publicUser(rows[0]) })
})

router.post('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {}
  if (typeof currentPassword !== 'string' || !(await bcrypt.compare(currentPassword, req.user.password_hash))) {
    throw new HttpError(400, 'Please check your details and try again.', { currentPassword: 'That is not your current password.' })
  }
  failIfInvalid({ newPassword: checkNewPassword(newPassword) })
  if (newPassword === currentPassword) {
    throw new HttpError(400, 'Please check your details and try again.', { newPassword: 'Choose a password you have not used just now.' })
  }
  const hash = await bcrypt.hash(newPassword, 12)
  // password_changed_at signs out every older login; the caller gets a fresh token.
  const { rows } = await pool.query(
    'update users set password_hash = $1, password_changed_at = date_trunc(\'second\', now()) where id = $2 returning *',
    [hash, req.user.id],
  )
  res.json({ user: publicUser(rows[0]), token: signToken(rows[0]) })
})

// Everything we hold about the caller, as JSON (photos are counted, not included).
router.get('/export', async (req, res) => {
  const id = req.user.id
  const q = async (sql) => (await pool.query(sql, [id])).rows
  const data = {
    exportedAt: new Date().toISOString(),
    account: publicUser(req.user),
    savedHomes: await q('select property_id, created_at from saved_homes where user_id = $1'),
    viewings: await q('select * from viewings where user_id = $1'),
    reports: await q('select r.*, (select count(*)::int from report_photos p where p.report_id = r.id) as photo_count from reports r where r.user_id = $1'),
    orders: await q('select o.*, coalesce((select json_agg(i) from order_items i where i.order_id = o.id), \'[]\') as items from orders o where o.user_id = $1'),
    serviceRequests: await q('select * from service_requests where user_id = $1'),
    conversations: await q('select * from conversations where user_id = $1'),
    messages: await q('select m.* from messages m join conversations c on c.id = m.conversation_id where c.user_id = $1 order by m.created_at, m.id'),
  }
  res.set('Content-Disposition', 'attachment; filename="havenlink-my-data.json"')
  res.json(data)
})

// Permanently deletes the account and everything tied to it (needs the password).
router.post('/delete', async (req, res) => {
  const { password } = req.body ?? {}
  if (typeof password !== 'string' || !(await bcrypt.compare(password, req.user.password_hash))) {
    throw new HttpError(400, 'Please check your details and try again.', { password: 'That password is not correct.' })
  }
  await withTransaction((client) => client.query('delete from users where id = $1', [req.user.id]))
  res.status(204).end()
})

export default router
