import { Router } from 'express'
import { config } from '../config.js'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/tx.js'
import { HttpError, failIfInvalid } from '../utils/errors.js'
import { checkName, checkPhone, isDateString, isInt, isText, yesterday } from '../utils/validate.js'
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
  // The browser only says WHICH product, how many and which options. Names and prices come from the database.
  const itemsOk = items.length >= 1 && items.length <= MAX_ITEMS && items.every((i) => i && isInt(i.productId, 1, 2_000_000_000)
    && isInt(i.qty, 1, 10)
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

  // Look up every product and work out its real price (base price plus any chosen options).
  const itemsError = (message) => new HttpError(400, 'Please check your details and try again.', { items: message })
  const { rows: found } = await pool.query(
    "select id, name, price, stock, data -> 'options' as options from products where id = any($1) and published",
    [[...new Set(items.map((i) => i.productId))]],
  )
  const byId = new Map(found.map((p) => [p.id, p]))
  const priced = items.map((i) => {
    const p = byId.get(i.productId)
    if (!p) throw itemsError('One of the items in your cart is no longer available.')
    if (p.stock < 1) throw itemsError(`${p.name} is sold out.`)
    if (i.qty > p.stock) throw itemsError(`Only ${p.stock} of ${p.name} left.`)
    const groups = p.options ?? []
    const asked = i.choices ?? {}
    if (Object.keys(asked).some((k) => !groups.some((g) => g.name === k))) throw itemsError(`An option for ${p.name} is not valid.`)
    let extra = 0
    const choices = {}
    for (const g of groups) {
      const pick = g.choices.find((c) => c.label === (asked[g.name] ?? g.choices[0].label))
      if (!pick) throw itemsError(`An option for ${p.name} is not valid.`)
      extra += pick.extra
      choices[g.name] = pick.label
    }
    return { productId: p.id, name: p.name, qty: i.qty, unitPrice: Math.round((Number(p.price) + extra) * 100) / 100, choices }
  })

  // Totals are worked out here from the database prices. Never trust prices or totals sent by the browser.
  const subtotal = Math.round(priced.reduce((sum, i) => sum + i.qty * i.unitPrice, 0) * 100) / 100
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
    for (const i of priced) {
      await db.query('insert into order_items (order_id, product_id, name, qty, unit_price, choices) values ($1, $2, $3, $4, $5, $6)',
        [rows[0].id, i.productId, i.name, i.qty, i.unitPrice, i.choices])
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
