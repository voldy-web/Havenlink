// The owner's side of a tenancy: offer a home to someone who viewed it, acknowledge the move-in
// report, and record the move-out inspection and deposit settlement. Limited to the owner's own homes.
import { Router } from 'express'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/tx.js'
import { HttpError, failIfInvalid } from '../utils/errors.js'
import { isDateString, isInt, isText, yesterday } from '../utils/validate.js'
import { insertWithRef, REF_PATTERN } from '../utils/refs.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { checkRooms, setHomeStatus, toTenancies, TENANCY_COLUMNS } from '../utils/tenancy.js'

const router = Router()
router.use(requireAuth, requireRole('owner'))

const money = (v, max) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max
const round2 = (n) => Math.round(n * 100) / 100

router.get('/tenancies', async (req, res) => {
  const { rows } = await pool.query(`select ${TENANCY_COLUMNS} from tenancies t where t.owner_id = $1 order by t.created_at desc`, [req.user.id])
  res.json({ tenancies: await toTenancies(rows, 'owner') })
})

// Offer a home to a person who viewed it (the viewing must be confirmed or rescheduled).
router.post('/tenancies', async (req, res) => {
  const b = req.body ?? {}
  failIfInvalid({
    viewingReference: typeof b.viewingReference === 'string' && REF_PATTERN.test(b.viewingReference) ? null : 'Choose a viewing.',
    monthlyRent: money(b.monthlyRent, 10_000_000) && b.monthlyRent > 0 ? null : 'Enter the monthly rent.',
    deposit: money(b.deposit, 10_000_000) ? null : 'Enter the deposit (0 if none).',
    startDate: isDateString(b.startDate) && b.startDate >= yesterday() ? null : 'Choose a start date that has not passed.',
    termMonths: isInt(b.termMonths, 1, 60) ? null : 'The term must be 1 to 60 months.',
  })
  try {
    const row = await insertWithRef('T', (reference) => withTransaction(async (db) => {
      const v = (await db.query(
        `select v.*, p.listing_type, p.review_status, p.data ->> 'title' as title from viewings v join properties p on p.id = v.property_id
         where v.reference = $1 and p.owner_id = $2 and p.source = 'owner' for update of v`,
        [b.viewingReference, req.user.id],
      )).rows[0]
      if (!v) throw new HttpError(404, 'Viewing not found.')
      if (!['Confirmed', 'Rescheduled'].includes(v.status)) throw new HttpError(409, 'Confirm the viewing before offering the home.')
      if (v.listing_type !== 'rent' || v.review_status !== 'approved') throw new HttpError(409, 'Only a live home for rent can be offered.')
      if (v.user_id === req.user.id) throw new HttpError(400, 'You cannot offer your own home to yourself.')
      const { rows } = await db.query(
        `insert into tenancies (reference, property_id, property_title, owner_id, resident_id, monthly_rent, deposit, start_date, term_months)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
        [reference, v.property_id, v.title, req.user.id, v.user_id, round2(b.monthlyRent), round2(b.deposit), b.startDate, b.termMonths],
      )
      await setHomeStatus(db, v.property_id, 'Reserved')
      return (await db.query(`select ${TENANCY_COLUMNS} from tenancies t where t.id = $1`, [rows[0].id])).rows[0]
    }))
    res.status(201).json({ tenancy: (await toTenancies([row], 'owner'))[0] })
  } catch (err) {
    if (err.constraint === 'tenancies_one_live_per_home') throw new HttpError(409, 'This home already has a tenancy in progress.')
    throw err
  }
})

// Runs `change` on one of the caller's tenancies when it is in an allowed status.
function act(action, allowed, change) {
  router.post(`/tenancies/:reference/${action}`, async (req, res) => {
    if (!REF_PATTERN.test(req.params.reference)) throw new HttpError(404, 'Tenancy not found.')
    const row = await withTransaction(async (db) => {
      const found = (await db.query(`select ${TENANCY_COLUMNS} from tenancies t where t.reference = $1 and t.owner_id = $2 for update of t`, [req.params.reference, req.user.id])).rows[0]
      if (!found) throw new HttpError(404, 'Tenancy not found.')
      if (!allowed.includes(found.status)) throw new HttpError(409, `This tenancy is ${found.status.toLowerCase()}, so this cannot be done now.`)
      await change(db, found, req.body ?? {})
      return (await db.query(`select ${TENANCY_COLUMNS} from tenancies t where t.id = $1`, [found.id])).rows[0]
    })
    res.json({ tenancy: (await toTenancies([row], 'owner'))[0] })
  })
}

act('withdraw', ['Offered'], async (db, t) => {
  await db.query("update tenancies set status = 'Withdrawn', updated_at = now() where id = $1", [t.id])
  await setHomeStatus(db, t.property_id, 'Available')
})

act('move-in/acknowledge', ['Active', 'Notice given'], async (db, t) => {
  if (!t.move_in_submitted_at) throw new HttpError(409, 'The resident has not sent a move-in report yet.')
  if (t.move_in_acknowledged_at) throw new HttpError(409, 'You have already acknowledged this report.')
  await db.query('update tenancies set move_in_acknowledged_at = now(), updated_at = now() where id = $1', [t.id])
})

// The move-out inspection and the deposit settlement: what is kept back, why, and what is returned.
act('settle', ['Notice given'], async (db, t, b) => {
  const deposit = Number(t.deposit)
  const deductions = Array.isArray(b.deductions) ? b.deductions : null
  const fine = deductions && deductions.length <= 10 && deductions.every((d) => d && isText(d.reason, 3, 120) && money(d.amount, deposit) && d.amount > 0)
  const total = fine ? round2(deductions.reduce((s, d) => s + d.amount, 0)) : 0
  failIfInvalid({
    items: checkRooms(b.items),
    deductions: fine ? (total <= deposit ? null : 'The deductions are more than the deposit.') : 'Each deduction needs a reason and an amount, and none can be more than the deposit.',
    notes: b.notes === undefined || b.notes === '' || isText(b.notes, 0, 500) ? null : 'The notes are too long (500 characters at most).',
  })
  await db.query("delete from condition_items where tenancy_id = $1 and stage = 'move_out'", [t.id])
  for (const i of b.items) {
    await db.query("insert into condition_items (tenancy_id, stage, room, condition, note) values ($1, 'move_out', $2, $3, $4)", [t.id, i.room, i.condition, (i.note ?? '').trim()])
  }
  const settlement = {
    deductions: deductions.map((d) => ({ reason: d.reason.trim(), amount: round2(d.amount) })),
    totalDeductions: total, refund: round2(deposit - total), notes: (b.notes ?? '').trim(), settledAt: new Date().toISOString(),
  }
  await db.query("update tenancies set status = 'Ended', ended_at = now(), settlement = $2, updated_at = now() where id = $1", [t.id, settlement])
  await setHomeStatus(db, t.property_id, 'Available')
})

export default router
