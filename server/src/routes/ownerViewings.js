// Viewing requests for the signed-in owner's homes. The owner sees only requests for homes that
// they own (properties.owner_id), and answers each one: confirm, decline or suggest another time.
import { Router } from 'express'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/tx.js'
import { HttpError, failIfInvalid } from '../utils/errors.js'
import { isDateString, isText, yesterday } from '../utils/validate.js'
import { REF_PATTERN } from '../utils/refs.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { toViewing } from './viewings.js'

const router = Router()
router.use(requireAuth, requireRole('owner'))

// The client's contact details are shown to the owner of the home they asked to view, and no one else.
const toOwnerViewing = (r) => ({ ...toViewing(r), listingType: r.listing_type, client: { name: r.name, phone: r.phone, email: r.email } })

const OWN = "from viewings v join properties p on p.id = v.property_id where p.owner_id = $1 and p.source = 'owner'"

router.get('/viewings', async (req, res) => {
  const { rows } = await pool.query(`select v.*, p.listing_type ${OWN} order by v.viewing_date, v.viewing_time`, [req.user.id])
  res.json({ viewings: rows.map(toOwnerViewing) })
})

// Numbers for the badges in the owner's menu.
router.get('/summary', async (req, res) => {
  const viewings = (await pool.query(`select count(*)::int as n ${OWN} and v.status = 'Pending'`, [req.user.id])).rows[0].n
  const listings = (await pool.query("select review_status, count(*)::int as n from properties where owner_id = $1 and source = 'owner' group by review_status", [req.user.id])).rows
  res.json({ pendingViewings: viewings, listings: Object.fromEntries(listings.map((l) => [l.review_status, l.n])) })
})

// Moves a viewing to a new status, but only from the statuses that make sense.
function respond(action, from, to, check) {
  router.post(`/viewings/:reference/${action}`, async (req, res) => {
    if (!REF_PATTERN.test(req.params.reference)) throw new HttpError(404, 'Viewing not found.')
    const b = req.body ?? {}
    const note = typeof b.note === 'string' ? b.note.trim() : ''
    if (note.length > 300) failIfInvalid({ note: 'The note is too long (300 characters at most).' })
    check?.(b, note)

    try {
      const row = await withTransaction(async (db) => {
        const found = (await db.query(`select v.*, p.listing_type ${OWN} and v.reference = $2 for update of v`, [req.user.id, req.params.reference])).rows[0]
        if (!found) throw new HttpError(404, 'Viewing not found.')
        if (!from.includes(found.status)) throw new HttpError(409, `This viewing is ${found.status.toLowerCase()} and cannot be ${action}d.`)
        const rescheduled = action === 'reschedule'
        const updated = (await db.query(
          `update viewings set status = $2, owner_note = $3, responded_at = now(),
             viewing_date = coalesce($4, viewing_date), viewing_time = coalesce($5, viewing_time)
           where id = $1 returning *`,
          [found.id, to, note, rescheduled ? b.date : null, rescheduled ? b.time : null],
        )).rows[0]
        return { ...updated, listing_type: found.listing_type }
      })
      res.json({ viewing: toOwnerViewing(row) })
    } catch (err) {
      if (err.constraint === 'viewings_no_double_booking') throw new HttpError(409, 'That person already has a viewing of this home at that time.')
      throw err
    }
  })
}

respond('confirm', ['Pending'], 'Confirmed')
respond('decline', ['Pending', 'Confirmed', 'Rescheduled'], 'Declined', (_b, note) => {
  failIfInvalid({ note: isText(note, 3, 300) ? null : 'Tell the visitor why (3 to 300 characters).' })
})
respond('reschedule', ['Pending', 'Confirmed', 'Rescheduled'], 'Rescheduled', (b) => {
  failIfInvalid({
    date: isDateString(b.date) && b.date >= yesterday() ? null : 'Choose a date that has not passed.',
    time: typeof b.time === 'string' && /^\d{1,2}:\d{2} (AM|PM)$/.test(b.time) ? null : 'Choose a time.',
  })
})

export default router
