// The resident's side of a tenancy: see offers, accept or decline, write the move-in report,
// and give notice. Every query is limited to tenancies where the caller is the resident.
import { Router } from 'express'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/tx.js'
import { HttpError, failIfInvalid } from '../utils/errors.js'
import { isDateString } from '../utils/validate.js'
import { REF_PATTERN } from '../utils/refs.js'
import { requireAuth } from '../middleware/auth.js'
import { checkRooms, setHomeStatus, toTenancies, TENANCY_COLUMNS } from '../utils/tenancy.js'

const router = Router()
router.use(requireAuth)

const dayFromNow = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)

router.get('/', async (req, res) => {
  const { rows } = await pool.query(`select ${TENANCY_COLUMNS} from tenancies t where t.resident_id = $1 order by t.created_at desc`, [req.user.id])
  res.json({ tenancies: await toTenancies(rows, 'resident') })
})

// Runs `change` on one of the caller's tenancies, only when it is in one of the allowed statuses.
function act(action, allowed, change) {
  router.post(`/:reference/${action}`, async (req, res) => {
    if (!REF_PATTERN.test(req.params.reference)) throw new HttpError(404, 'Tenancy not found.')
    const row = await withTransaction(async (db) => {
      const found = (await db.query(`select ${TENANCY_COLUMNS} from tenancies t where t.reference = $1 and t.resident_id = $2 for update of t`, [req.params.reference, req.user.id])).rows[0]
      if (!found) throw new HttpError(404, 'Tenancy not found.')
      if (!allowed.includes(found.status)) throw new HttpError(409, `This tenancy is ${found.status.toLowerCase()}, so this cannot be done now.`)
      await change(db, found, req.body ?? {})
      return (await db.query(`select ${TENANCY_COLUMNS} from tenancies t where t.id = $1`, [found.id])).rows[0]
    })
    res.json({ tenancy: (await toTenancies([row], 'resident'))[0] })
  })
}

act('accept', ['Offered'], async (db, t) => {
  await db.query("update tenancies set status = 'Active', updated_at = now() where id = $1", [t.id])
  await setHomeStatus(db, t.property_id, 'Rented')
})

act('decline', ['Offered'], async (db, t) => {
  await db.query("update tenancies set status = 'Declined', updated_at = now() where id = $1", [t.id])
  await setHomeStatus(db, t.property_id, 'Available')
})

// The resident describes each room when they move in. They can send it again until the owner has acknowledged it.
act('move-in', ['Active'], async (db, t, body) => {
  if (t.move_in_acknowledged_at) throw new HttpError(409, 'The owner has already acknowledged your move-in report.')
  failIfInvalid({ items: checkRooms(body.items) })
  await db.query("delete from condition_items where tenancy_id = $1 and stage = 'move_in'", [t.id])
  for (const i of body.items) {
    await db.query("insert into condition_items (tenancy_id, stage, room, condition, note) values ($1, 'move_in', $2, $3, $4)", [t.id, i.room, i.condition, (i.note ?? '').trim()])
  }
  await db.query('update tenancies set move_in_submitted_at = now(), updated_at = now() where id = $1', [t.id])
})

act('notice', ['Active'], async (db, t, body) => {
  const date = body.moveOutDate
  failIfInvalid({
    moveOutDate: isDateString(date) && date >= dayFromNow(1) && date >= String(t.start_date).slice(0, 10) && date <= dayFromNow(1100)
      ? null : 'Choose a move-out date after today (and not after the end of the term).',
  })
  await db.query("update tenancies set status = 'Notice given', move_out_date = $2, notice_given_at = now(), updated_at = now() where id = $1", [t.id, date])
})

export default router
