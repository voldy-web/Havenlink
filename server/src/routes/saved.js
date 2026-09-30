import { Router } from 'express'
import { pool } from '../db/pool.js'
import { HttpError } from '../utils/errors.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const parseId = (value) => {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1 || id > 1_000_000) throw new HttpError(400, 'Invalid home.')
  return id
}

router.get('/', async (req, res) => {
  const { rows } = await pool.query('select property_id from saved_homes where user_id = $1 order by created_at', [req.user.id])
  res.json({ ids: rows.map((r) => r.property_id) })
})

// Saving twice is fine: it just stays saved.
router.put('/:propertyId', async (req, res) => {
  await pool.query('insert into saved_homes (user_id, property_id) values ($1, $2) on conflict do nothing', [req.user.id, parseId(req.params.propertyId)])
  res.status(204).end()
})

router.delete('/:propertyId', async (req, res) => {
  await pool.query('delete from saved_homes where user_id = $1 and property_id = $2', [req.user.id, parseId(req.params.propertyId)])
  res.status(204).end()
})

export default router
