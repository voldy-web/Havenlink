import { Router } from 'express'
import { pool } from '../db/pool.js'
import { failIfInvalid } from '../utils/errors.js'
import { isInt, isMoney, isText } from '../utils/validate.js'
import { insertWithRef } from '../utils/refs.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const toRequest = (r) => ({
  reference: r.reference, providerId: r.provider_id, providerName: r.provider_name, service: r.service,
  slot: r.slot, address: r.address, note: r.note, fee: r.fee, method: r.method,
  paymentStatus: r.payment_status, createdAt: r.created_at,
})

router.get('/', async (req, res) => {
  const { rows } = await pool.query('select * from service_requests where user_id = $1 order by created_at desc', [req.user.id])
  res.json({ requests: rows.map(toRequest) })
})

// Records that this person paid the (demo) fee to unlock a provider's contact details.
router.post('/', async (req, res) => {
  const b = req.body ?? {}
  failIfInvalid({
    providerId: isInt(b.providerId, 1, 1_000_000) ? null : 'Choose a provider.',
    providerName: isText(b.providerName, 1, 120) ? null : 'Missing provider name.',
    service: isText(b.service, 1, 160) ? null : 'Choose a service.',
    slot: ['morning', 'afternoon', 'urgent'].includes(b.slot) ? null : 'Choose a time slot.',
    address: isText(b.address, 5, 200) ? null : 'Enter the address where the work is needed.',
    note: b.note === undefined || b.note === '' || isText(b.note, 0, 500) ? null : 'The note is too long.',
    fee: isMoney(b.fee, 10_000) ? null : 'The fee is not valid.',
    method: isText(b.method, 2, 40) ? null : 'Choose a payment method.',
  })
  const row = await insertWithRef('S', async (reference) => (await pool.query(
    `insert into service_requests (reference, user_id, provider_id, provider_name, service, slot, address, note, fee, method)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning *`,
    [reference, req.user.id, b.providerId, b.providerName.trim(), b.service.trim(), b.slot, b.address.trim(), (b.note || '').trim(), b.fee, b.method.trim()],
  )).rows[0])
  res.status(201).json({ request: toRequest(row) })
})

export default router
