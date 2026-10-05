// Review queue for homes that owners post. Only admin accounts can use it.
import { Router } from 'express'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/tx.js'
import { HttpError, failIfInvalid } from '../utils/errors.js'
import { isText } from '../utils/validate.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth, requireRole('admin'))

const STATUSES = ['pending', 'approved', 'rejected', 'paused']

const row = (r) => ({
  id: r.id, reviewStatus: r.review_status, reviewNote: r.review_note, submittedAt: r.created_at, updatedAt: r.updated_at,
  owner: { name: r.owner_name, email: r.owner_email }, listing: r.data,
})

const SELECT = `select p.*, u.name as owner_name, u.email as owner_email
  from properties p left join users u on u.id = p.owner_id where p.source = 'owner'`

router.get('/properties', async (req, res) => {
  const status = req.query.status ?? 'pending'
  if (status !== 'all' && !STATUSES.includes(status)) throw new HttpError(400, 'Unknown status.')
  const { rows } = await pool.query(`${SELECT} ${status === 'all' ? '' : 'and p.review_status = $1'} order by p.updated_at`, status === 'all' ? [] : [status])
  res.json({ listings: rows.map(row) })
})

router.get('/properties/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Listing not found.')
  const { rows } = await pool.query(`${SELECT} and p.id = $1`, [id])
  if (!rows[0]) throw new HttpError(404, 'Listing not found.')
  res.json({ listing: row(rows[0]) })
})

// Approve or reject a listing that is waiting for review.
for (const [action, to] of [['approve', 'approved'], ['reject', 'rejected']]) {
  router.post(`/properties/:id/${action}`, async (req, res) => {
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : ''
    if (action === 'reject') failIfInvalid({ note: isText(note, 3, 500) ? null : 'Tell the owner why (3 to 500 characters).' })
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Listing not found.')
    await withTransaction(async (db) => {
      const found = (await db.query("select review_status from properties where id = $1 and source = 'owner' for update", [id])).rows[0]
      if (!found) throw new HttpError(404, 'Listing not found.')
      if (found.review_status !== 'pending') throw new HttpError(409, 'This listing is not waiting for review.')
      await db.query(
        'update properties set review_status = $2, review_note = $3, reviewed_by = $4, reviewed_at = now(), updated_at = now() where id = $1',
        [id, to, action === 'reject' ? note : '', req.user.id],
      )
    })
    const { rows } = await pool.query(`${SELECT} and p.id = $1`, [id])
    res.json({ listing: row(rows[0]) })
  })
}

export default router
