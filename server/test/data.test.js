import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, call, signUp, tomorrow, pool } from './helpers.js'

let api, ama, kojo
before(async () => {
  api = await startServer()
  ama = await signUp(api.base, { name: 'Ama Mensah' })
  kojo = await signUp(api.base, { name: 'Kojo Owner', role: 'owner' })
})
after(() => api.close())

const post = (path, body, who = ama) => call(api.base, path, { method: 'POST', body, token: who.token })
const get = (path, who = ama) => call(api.base, path, { token: who.token })

test('every account-data route needs a signed-in user', async () => {
  for (const path of ['/api/saved', '/api/viewings', '/api/reports', '/api/orders', '/api/service-requests']) {
    assert.equal((await call(api.base, path)).status, 401, path)
    assert.equal((await call(api.base, path, { token: 'garbage' })).status, 401, path)
  }
})

// ---------- saved homes ----------
test('saved homes: save, list, save twice, remove, and stay private', async () => {
  assert.equal((await call(api.base, '/api/saved/5', { method: 'PUT', token: ama.token })).status, 204)
  assert.equal((await call(api.base, '/api/saved/5', { method: 'PUT', token: ama.token })).status, 204)
  assert.equal((await call(api.base, '/api/saved/9', { method: 'PUT', token: ama.token })).status, 204)
  assert.deepEqual((await get('/api/saved')).body.ids, [5, 9])
  assert.deepEqual((await get('/api/saved', kojo)).body.ids, [])
  await call(api.base, '/api/saved/5', { method: 'DELETE', token: ama.token })
  assert.deepEqual((await get('/api/saved')).body.ids, [9])
})

test('saved homes: rejects bad ids', async () => {
  for (const id of ['0', '-1', 'abc', '1.5', '99999999']) {
    assert.equal((await call(api.base, `/api/saved/${id}`, { method: 'PUT', token: ama.token })).status, 400, id)
  }
})

// ---------- viewings ----------
const viewing = (over = {}) => ({
  propertyId: 5, propertyTitle: 'Airport Residential Modern Flat', format: 'video', date: tomorrow(),
  time: '3:00 PM', attendees: 2, name: 'Ama Mensah', phone: '0241234567', email: 'ama@example.com', moveIn: '', pet: 'none', ...over,
})

test('viewings: book, list, and only the owner sees it', async () => {
  const r = await post('/api/viewings', viewing())
  assert.equal(r.status, 201)
  assert.match(r.body.viewing.reference, /^HL-V-\d{6}$/)
  assert.equal(r.body.viewing.status, 'Pending')
  assert.equal(r.body.viewing.date, tomorrow())
  assert.equal((await get('/api/viewings')).body.viewings.length, 1)
  assert.equal((await get('/api/viewings', kojo)).body.viewings.length, 0)
})

test('viewings: the same time twice is refused; a different time is fine', async () => {
  assert.equal((await post('/api/viewings', viewing())).status, 409)
  assert.equal((await post('/api/viewings', viewing({ time: '4:30 PM' }))).status, 201)
})

test('viewings: bad input is refused with field messages', async () => {
  const r = await post('/api/viewings', viewing({ date: '2020-01-01', time: 'noon', attendees: 50, format: 'hologram', email: 'nope' }))
  assert.equal(r.status, 400)
  for (const f of ['date', 'time', 'attendees', 'format', 'email']) assert.ok(r.body.fields[f], f)
  assert.equal((await post('/api/viewings', viewing({ date: '2026-02-31' }))).status, 400)
})

test('viewings: cancel works for the owner and not for anyone else', async () => {
  const list = (await get('/api/viewings')).body.viewings
  const ref = list[0].reference
  assert.equal((await call(api.base, `/api/viewings/${ref}/cancel`, { method: 'PATCH', token: kojo.token })).status, 404)
  const r = await call(api.base, `/api/viewings/${ref}/cancel`, { method: 'PATCH', token: ama.token })
  assert.equal(r.body.viewing.status, 'Cancelled')
  // A cancelled slot can be booked again.
  assert.equal((await post('/api/viewings', viewing({ time: list[0].time }))).status, 201)
  assert.equal((await call(api.base, '/api/viewings/not-a-ref/cancel', { method: 'PATCH', token: ama.token })).status, 404)
})

// ---------- reports ----------
const tinyPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='
const report = (over = {}) => ({
  home: '12 Palm Avenue, Flat 3', category: 'plumbing', urgency: 'urgent', summary: 'Kitchen sink is leaking',
  description: 'Slow drip under the cabinet, getting worse.', photos: [tinyPhoto], ...over,
})

test('reports: create with a photo, see history, stay private', async () => {
  const r = await post('/api/reports', report())
  assert.equal(r.status, 201)
  const rep = r.body.report
  assert.match(rep.reference, /^HL-R-\d{6}$/)
  assert.equal(rep.status, 'Submitted')
  assert.equal(rep.photos.length, 1)
  assert.deepEqual(rep.history.map((h) => h.status), ['Submitted'])
  assert.equal((await get('/api/reports')).body.reports.length, 1)
  assert.equal((await get('/api/reports', kojo)).body.reports.length, 0)
})

test('reports: validation, including photo rules', async () => {
  const bad = await post('/api/reports', report({ category: 'magic', urgency: 'now', summary: 'x', description: 'short' }))
  assert.equal(bad.status, 400)
  for (const f of ['category', 'urgency', 'summary', 'description']) assert.ok(bad.body.fields[f], f)
  assert.equal((await post('/api/reports', report({ photos: [tinyPhoto, tinyPhoto, tinyPhoto, tinyPhoto] }))).status, 400)
  assert.equal((await post('/api/reports', report({ photos: ['<script>alert(1)</script>'] }))).status, 400)
  assert.equal((await post('/api/reports', report({ photos: ['data:text/html;base64,PHNjcmlwdD4='] }))).status, 400)
  assert.equal((await post('/api/reports', report({ photos: [] }))).status, 201)
})

test('reports: accept a request bigger than the default limit (photos)', async () => {
  const bigish = `data:image/jpeg;base64,${'A'.repeat(150_000)}`
  assert.equal((await post('/api/reports', report({ photos: [bigish, bigish] }))).status, 201)
  const tooBig = `data:image/jpeg;base64,${'A'.repeat(300_000)}`
  assert.equal((await post('/api/reports', report({ photos: [tooBig] }))).status, 400)
})

test('reports: advance moves through the four stages, only for the owner', async () => {
  const ref = (await get('/api/reports')).body.reports.at(-1).reference
  const adv = (who) => call(api.base, `/api/reports/${ref}/advance`, { method: 'PATCH', token: who.token })
  assert.equal((await adv(kojo)).status, 404)
  const seen = []
  for (let i = 0; i < 3; i++) seen.push((await adv(ama)).body.report.status)
  assert.deepEqual(seen, ['Acknowledged', 'In Progress', 'Resolved'])
  assert.equal((await adv(ama)).status, 409)
  const final = (await get('/api/reports')).body.reports.find((r) => r.reference === ref)
  assert.deepEqual(final.history.map((h) => h.status), ['Submitted', 'Acknowledged', 'In Progress', 'Resolved'])
})

// ---------- orders ----------
const order = (over = {}) => ({
  items: [{ productId: 2, name: 'Kanso Sofa', qty: 1, unitPrice: 3900, choices: { Layout: 'Left Chaise' } }],
  address: { name: 'Ama Mensah', phone: '0241234567', street: '5 Test Road', area: 'Osu', city: 'Accra', notes: '' },
  deliveryDate: tomorrow(), deliveryWindow: '1:00 PM - 4:00 PM', paymentMethod: 'MTN MoMo', paid: true, ...over,
})

test('orders: create, totals are worked out by the server, private to the owner', async () => {
  const r = await post('/api/orders', order({ subtotal: 1, total: 1, deliveryFee: 0 }))
  assert.equal(r.status, 201)
  const o = r.body.order
  assert.match(o.reference, /^HL-O-\d{6}$/)
  assert.equal(o.subtotal, 3900)
  assert.equal(o.deliveryFee, 0)
  assert.equal(o.total, 3900)
  assert.equal(o.items[0].choices.Layout, 'Left Chaise')
  assert.equal(o.address.street, '5 Test Road')
  assert.deepEqual(o.history.map((h) => h.status), ['Confirmed'])
  assert.equal((await get('/api/orders', kojo)).body.orders.length, 0)
})

test('orders: delivery fee applies under GH₵3,000 and totals add up', async () => {
  const r = await post('/api/orders', order({ items: [{ productId: 9, name: 'Kettle', qty: 3, unitPrice: 180 }] }))
  assert.equal(r.body.order.subtotal, 540)
  assert.equal(r.body.order.deliveryFee, 80)
  assert.equal(r.body.order.total, 620)
})

test('orders: bad input is refused', async () => {
  for (const bad of [
    order({ items: [] }),
    order({ items: [{ productId: 1, name: 'x', qty: 0, unitPrice: 5 }] }),
    order({ items: [{ productId: 1, name: 'x', qty: 1, unitPrice: -5 }] }),
    order({ items: [{ productId: 1, name: 'x', qty: 1, unitPrice: 'free' }] }),
    order({ address: { name: 'A', phone: '1', street: '', area: '', city: '' } }),
    order({ deliveryDate: '2020-01-01' }),
    order({ paymentMethod: '' }),
  ]) {
    assert.equal((await post('/api/orders', bad)).status, 400)
  }
})

test('orders: advance to Delivered, only for the owner', async () => {
  const ref = (await get('/api/orders')).body.orders[0].reference
  const adv = (who) => call(api.base, `/api/orders/${ref}/advance`, { method: 'PATCH', token: who.token })
  assert.equal((await adv(kojo)).status, 404)
  const seen = []
  for (let i = 0; i < 3; i++) seen.push((await adv(ama)).body.order.status)
  assert.deepEqual(seen, ['Packed', 'Out for Delivery', 'Delivered'])
  assert.equal((await adv(ama)).status, 409)
})

// ---------- service requests ----------
const request = (over = {}) => ({
  providerId: 1, providerName: 'Kwame Boateng', service: 'Pipe & Sink Drain Repairs', slot: 'morning',
  address: '12 Palm Street, Osu', note: 'Leaking sink', fee: 15, method: 'Card', ...over,
})

test('service requests: create, list, private, validated', async () => {
  const r = await post('/api/service-requests', request())
  assert.equal(r.status, 201)
  assert.match(r.body.request.reference, /^HL-S-\d{6}$/)
  assert.equal((await get('/api/service-requests')).body.requests.length, 1)
  assert.equal((await get('/api/service-requests', kojo)).body.requests.length, 0)
  assert.equal((await post('/api/service-requests', request({ slot: 'midnight' }))).status, 400)
  assert.equal((await post('/api/service-requests', request({ fee: -1 }))).status, 400)
  assert.equal((await post('/api/service-requests', request({ address: 'x' }))).status, 400)
})

// ---------- safety ----------
test('deleting an account removes all of its data', async () => {
  const temp = await signUp(api.base)
  await call(api.base, '/api/saved/3', { method: 'PUT', token: temp.token })
  await post('/api/reports', report(), temp)
  await post('/api/orders', order(), temp)
  await pool.query('delete from users where id = $1', [temp.user.id])
  for (const table of ['saved_homes', 'reports', 'report_photos', 'report_events', 'orders', 'order_items', 'order_events']) {
    const { rows } = await pool.query(`select count(*)::int as n from ${table} where ${table === 'report_photos' || table === 'report_events' ? 'report_id in (select id from reports where user_id = $1)' : table === 'order_items' || table === 'order_events' ? 'order_id in (select id from orders where user_id = $1)' : 'user_id = $1'}`, [temp.user.id])
    assert.equal(rows[0].n, 0, table)
  }
})

test('another user cannot read data by guessing a reference', async () => {
  const list = (await get('/api/reports')).body.reports
  assert.ok(list.length > 0)
  assert.equal((await get('/api/reports', kojo)).body.reports.length, 0)
  assert.equal((await get('/api/orders', kojo)).body.orders.length, 0)
  assert.equal((await get('/api/viewings', kojo)).body.viewings.length, 0)
})

test('DEMO_TOOLS off: the advance routes are closed', async () => {
  const { config } = await import('../src/config.js')
  config.demoTools = false
  try {
    const ref = (await get('/api/reports')).body.reports[0].reference
    assert.equal((await call(api.base, `/api/reports/${ref}/advance`, { method: 'PATCH', token: ama.token })).status, 403)
  } finally {
    config.demoTools = true
  }
})
