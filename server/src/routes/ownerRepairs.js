// Repair reports from the residents of the signed-in owner's homes. The owner moves each report
// forward and can add a note that the resident sees.
import { Router } from 'express'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/tx.js'
import { HttpError, failIfInvalid } from '../utils/errors.js'
import { REF_PATTERN } from '../utils/refs.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { toReports } from './reports.js'

const router = Router()
router.use(requireAuth, requireRole('owner'))

const STAGES = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved']

const OWN = 'from reports r join tenancies t on t.id = r.tenancy_id join users u on u.id = r.user_id where t.owner_id = $1'

async function withPeople(rows) {
  const reports = await toReports(rows)
  return reports.map((r, i) => ({ ...r, resident: { name: rows[i].resident_name }, propertyTitle: rows[i].property_title }))
}

router.get('/repairs', async (req, res) => {
  const { rows } = await pool.query(`select r.*, u.name as resident_name, t.property_title ${OWN} order by r.created_at desc`, [req.user.id])
  res.json({ reports: await withPeople(rows) })
})

router.get('/summary-repairs', async (req, res) => {
  const n = (await pool.query(`select count(*)::int as n ${OWN} and r.status <> 'Resolved'`, [req.user.id])).rows[0].n
  res.json({ openRepairs: n })
})

router.post('/repairs/:reference/status', async (req, res) => {
  if (!REF_PATTERN.test(req.params.reference)) throw new HttpError(404, 'Report not found.')
  const status = req.body?.status
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : ''
  failIfInvalid({
    status: STAGES.includes(status) ? null : 'Choose a stage.',
    note: note.length <= 300 ? null : 'The note is too long (300 characters at most).',
  })
  await withTransaction(async (db) => {
    const found = (await db.query(`select r.* ${OWN} and r.reference = $2 for update of r`, [req.user.id, req.params.reference])).rows[0]
    if (!found) throw new HttpError(404, 'Report not found.')
    if (STAGES.indexOf(status) <= STAGES.indexOf(found.status)) throw new HttpError(409, `This report is already ${found.status.toLowerCase()}. Choose a later stage.`)
    await db.query('update reports set status = $2 where id = $1', [found.id, status])
    await db.query('insert into report_events (report_id, status, note) values ($1, $2, $3)', [found.id, status, note])
  })
  const { rows } = await pool.query(`select r.*, u.name as resident_name, t.property_title ${OWN} and r.reference = $2`, [req.user.id, req.params.reference])
  res.json({ report: (await withPeople(rows))[0] })
})

export default router
