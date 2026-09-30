import { Router } from 'express'
import { config } from '../config.js'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/tx.js'
import { HttpError, failIfInvalid } from '../utils/errors.js'
import { checkName, checkPhone, isDateString, isInt, isMoney, isText, yesterday } from '../utils/validate.js'
import { insertWithRef, REF_PATTERN } from '../utils/refs.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const STAGES = ['Confirmed', 'Packed', 'Out for Delivery', 'Delivered']
// Keep in step with the website (services/orderService.js): free delivery over GH₵3,000.
const DELIVERY_FEE = 80
const FREE_DELIVERY_OVER = 3000
const MAX_ITEMS = 40

async function toOrders(rows) {
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const [items, events] = await Promise.all([
    pool.query('select order_id, product_id, name, qty, unit_price, choices from order_items where order_id = any($1) order by id', [ids]),
    pool.query('select order_id, status, created_at from order_events where order_id = any($1) order by created_at, id', [ids]),
  ])
  return rows.map((r) => ({
    reference: r.reference, status: r.status, subtotal: r.subtotal, deliveryFee: r.delivery_fee, total: r.total,
    paymentMethod: r.payment_method, paid: r.paid, deliveryDate: r.delivery_date, deliveryWindow: r.delivery_window,
    address: r.address, createdAt: r.created_at,
    items: items.rows.filter((i) => i.order_id === r.id).map((i) => ({
      productId: i.product_id, name: i.name, qty: i.qty, unitPrice: i.unit_price, choices: i.choices,
    })),
    history: events.rows.filter((e) => e.order_id === r.id).map((e) => ({ status: e.status, at: e.created_at })),
  }))
}

router.get('/', async (req, res) => {
  const { rows } = await pool.query('select * from orders where user_id = $1 order by created_at desc', [req.user.id])
  res.json({ orders: await toOrders(rows) })
})

router.post('/', async (req, res) => {
  const b = req.body ?? {}
  const items = Array.isArray(b.items) ? b.items : []
  const a = b.address ?? {}
  const itemsOk = items.length >= 1 && items.length <= MAX_ITEMS && items.every((i) => i && isInt(i.productId, 1, 1_000_000)
    && isText(i.name, 1, 200) && isInt(i.qty, 1, 10) && isMoney(i.unitPrice, 10_000_000)
    && (i.choices === undefined || (i.choices && typeof i.choices === 'object' && !Array.isArray(i.choices)
      && Object.keys(i.choices).length <= 10 && Object.values(i.choices).every((v) => isText(v, 1, 80)))))
  failIfInvalid({
    items: itemsOk ? null : 'Your cart items are not valid.',
    'address.name': checkName(a.name), 'address.phone': checkPhone(a.phone),
    'address.street': isText(a.street, 4, 200) ? null : 'Enter the street or house address.',
    'address.area': isText(a.area, 2, 100) ? null : 'Enter the area or neighbourhood.',
    'address.city': isText(a.city, 2, 60) ? null : 'Choose a city.',
    'address.notes': a.notes === undefined || a.notes === '' || isText(a.notes, 0, 300) ? null : 'Delivery notes are too long.',
    deliveryDate: isDateString(b.deliveryDate) && b.deliveryDate >= yesterday() ? null : 'Choose a delivery day.',
    deliveryWindow: isText(b.deliveryWindow, 3, 40) ? null : 'Choose a delivery time.',
    paymentMethod: isText(b.paymentMethod, 2, 40) ? null : 'Choose a payment method.',
  })

  // Totals are worked out here from the items. Never trust totals sent by the browser.
  // (Item prices are still sent by the browser until the products live in the database.)
  const subtotal = Math.round(items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0) * 100) / 100
  const deliveryFee = subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE
  const total = subtotal + deliveryFee
  const address = {
    name: a.name.trim(), phone: a.phone.trim(), street: a.street.trim(), area: a.area.trim(),
    city: a.city.trim(), notes: (a.notes || '').trim(),
  }

  const row = await insertWithRef('O', (reference) => withTransaction(async (db) => {
    const { rows } = await db.query(
      `insert into orders (reference, user_id, subtotal, delivery_fee, total, payment_method, paid, delivery_date, delivery_window, address)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning *`,
      [reference, req.user.id, subtotal, deliveryFee, total, b.paymentMethod.trim(), b.paid === true, b.deliveryDate, b.deliveryWindow.trim(), address],
    )
    for (const i of items) {
      await db.query('insert into order_items (order_id, product_id, name, qty, unit_price, choices) values ($1, $2, $3, $4, $5, $6)',
        [rows[0].id, i.productId, i.name.trim(), i.qty, i.unitPrice, i.choices ?? {}])
    }
    await db.query('insert into order_events (order_id, status) values ($1, $2)', [rows[0].id, 'Confirmed'])
    return rows[0]
  }))
  res.status(201).json({ order: (await toOrders([row]))[0] })
})

// TESTING ONLY (needs DEMO_TOOLS=true): moves your own order to its next stage,
// standing in for the vendor and delivery side that is not built yet.
router.patch('/:reference/advance', async (req, res) => {
  if (!config.demoTools) throw new HttpError(403, 'Not available.')
  if (!REF_PATTERN.test(req.params.reference)) throw new HttpError(404, 'Order not found.')
  const row = await withTransaction(async (db) => {
    const { rows } = await db.query('select * from orders where reference = $1 and user_id = $2 for update', [req.params.reference, req.user.id])
    if (!rows[0]) throw new HttpError(404, 'Order not found.')
    const next = STAGES[STAGES.indexOf(rows[0].status) + 1]
    if (!next) throw new HttpError(409, 'This order is already delivered.')
    const updated = await db.query('update orders set status = $1 where id = $2 returning *', [next, rows[0].id])
    await db.query('insert into order_events (order_id, status) values ($1, $2)', [rows[0].id, next])
    return updated.rows[0]
  })
  res.json({ order: (await toOrders([row]))[0] })
})

export default router
