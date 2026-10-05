import { Router } from 'express'
import { pool } from '../db/pool.js'
import { HttpError, failIfInvalid } from '../utils/errors.js'
import { checkName, checkEmail, checkPhone, isDateString, isInt, isText, yesterday, clean } from '../utils/validate.js'
import { insertWithRef, REF_PATTERN } from '../utils/refs.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const toViewing = (r) => ({
  reference: r.reference, propertyId: r.property_id, propertyTitle: r.property_title, format: r.format,
  date: r.viewing_date, time: r.viewing_time, attendees: r.attendees, name: r.name, phone: r.phone,
  email: r.email, moveIn: r.move_in || '', pet: r.pet, status: r.status, ownerNote: r.owner_note, respondedAt: r.responded_at, createdAt: r.created_at,
})
export { toViewing }

router.get('/', async (req, res) => {
  const { rows } = await pool.query('select * from viewings where user_id = $1 order by created_at desc', [req.user.id])
  res.json({ viewings: rows.map(toViewing) })
})

router.post('/', async (req, res) => {
  const b = req.body ?? {}
  failIfInvalid({
    propertyId: isInt(b.propertyId, 1, 1_000_000) ? null : 'Choose a home.',
    propertyTitle: isText(b.propertyTitle, 1, 120) ? null : 'Missing home name.',
    format: ['in-person', 'video'].includes(b.format) ? null : 'Choose a tour type.',
    date: isDateString(b.date) && b.date >= yesterday() ? null : 'Choose a date that has not passed.',
    time: typeof b.time === 'string' && /^\d{1,2}:\d{2} (AM|PM)$/.test(b.time) ? null : 'Choose a time.',
    attendees: isInt(b.attendees, 1, 10) ? null : 'Attendees must be 1 to 10.',
    name: checkName(b.name), phone: checkPhone(b.phone), email: checkEmail(b.email),
    moveIn: !b.moveIn || isDateString(b.moveIn) ? null : 'Move-in date is not valid.',
    pet: ['none', 'dog', 'cat', 'other'].includes(b.pet ?? 'none') ? null : 'Choose a pet option.',
  })

  try {
    const row = await insertWithRef('V', async (reference) => (await pool.query(
      `insert into viewings (reference, user_id, property_id, property_title, format, viewing_date, viewing_time,
         attendees, name, phone, email, move_in, pet)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) returning *`,
      [reference, req.user.id, b.propertyId, clean.text(b.propertyTitle), b.format, b.date, b.time, b.attendees,
        clean.text(b.name), clean.text(b.phone), clean.email(b.email), b.moveIn || null, b.pet ?? 'none'],
    )).rows[0])
    res.status(201).json({ viewing: toViewing(row) })
  } catch (err) {
    if (err.constraint === 'viewings_no_double_booking') throw new HttpError(409, 'You already have a viewing booked for this home at that time.')
    throw err
  }
})

router.patch('/:reference/cancel', async (req, res) => {
  if (!REF_PATTERN.test(req.params.reference)) throw new HttpError(404, 'Viewing not found.')
  // A viewing that was declined or already cancelled cannot be cancelled again.
  const { rows } = await pool.query(
    "update viewings set status = 'Cancelled' where reference = $1 and user_id = $2 and status in ('Pending', 'Confirmed', 'Rescheduled') returning *",
    [req.params.reference, req.user.id],
  )
  if (!rows[0]) {
    const exists = (await pool.query('select 1 from viewings where reference = $1 and user_id = $2', [req.params.reference, req.user.id])).rows[0]
    throw new HttpError(exists ? 409 : 404, exists ? 'This viewing can no longer be cancelled.' : 'Viewing not found.')
  }
  res.json({ viewing: toViewing(rows[0]) })
})

export default router
