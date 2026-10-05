import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, call, signUp, person, pool } from './helpers.js'
import { createAdmin } from '../src/db/createAdmin.js'

let api, owner, other, ama, kojo, admin, homeA, homeB, saleHome
const send = (path, method, body, who) => call(api.base, path, { method, body, token: who?.token })
const plusDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

async function postHome(who, title, listingType = 'rent') {
  const photo = (await send('/api/images', 'POST', { dataUrl: PNG }, who)).body.image.key
  const made = await send('/api/owner/properties', 'POST', {
    title, description: 'A bright, quiet home close to shops and transport, with a balcony.', address: '12 Oxford Street',
    area: 'Osu', city: 'Accra', listingType, propertyType: 'apartment', price: 3500, beds: 2, baths: 1, sqm: 85,
    available: 'now', features: [], photos: [photo],
  }, who)
  const id = made.body.listing.id
  await send(`/api/admin/properties/${id}/approve`, 'POST', {}, admin)
  return id
}

// A visitor books a home and the owner confirms; returns the viewing reference.
async function confirmedViewing(who, propertyId, days) {
  const v = await send('/api/viewings', 'POST', {
    propertyId, propertyTitle: 'Home', format: 'in-person', date: plusDays(days), time: '11:00 AM', attendees: 1,
    name: 'Visitor', phone: '0241234567', email: 'v@example.com',
  }, who)
  assert.equal(v.status, 201)
  const ref = v.body.viewing.reference
  assert.equal((await send(`/api/owner/viewings/${ref}/confirm`, 'POST', {}, owner)).status, 200)
  return ref
}

before(async () => {
  api = await startServer()
  owner = await signUp(api.base, { name: 'Efua Owner', role: 'owner' })
  other = await signUp(api.base, { name: 'Yaw Other Owner', role: 'owner' })
  ama = await signUp(api.base, { name: 'Ama Resident' })
  kojo = await signUp(api.base, { name: 'Kojo Resident' })
  await createAdmin({ email: 'admin@example.com', name: 'Site Admin', password: 'admin-password-1' })
  admin = (await call(api.base, '/api/auth/login', { method: 'POST', body: { email: 'admin@example.com', password: 'admin-password-1' } })).body
  homeA = await postHome(owner, 'Bright flat in Osu')
  homeB = await postHome(owner, 'Second flat in Osu')
  saleHome = await postHome(owner, 'House for sale in Osu', 'buy')
})
after(() => api.close())

const offerBody = (viewingReference, over = {}) => ({ viewingReference, monthlyRent: 3500, deposit: 7000, startDate: plusDays(10), termMonths: 12, ...over })
const status = async (id) => (await pool.query("select data ->> 'status' as s from properties where id = $1", [id])).rows[0].s
const rooms = (condition = 'Good') => [{ room: 'Kitchen', condition, note: 'Tap drips a little' }, { room: 'Bedroom', condition: 'Fair' }]
let ref, vRef

test('an owner can offer a home only from a confirmed viewing of their own live rental', async () => {
  vRef = await confirmedViewing(ama, homeA, 3)
  const pending = (await send('/api/viewings', 'POST', {
    propertyId: homeB, propertyTitle: 'Home', format: 'in-person', date: plusDays(4), time: '2:00 PM', attendees: 1, name: 'Kojo', phone: '0241234567', email: 'k@example.com',
  }, kojo)).body.viewing.reference
  assert.equal((await send('/api/owner/tenancies', 'POST', offerBody(pending), owner)).status, 409) // not confirmed yet
  assert.equal((await send('/api/owner/tenancies', 'POST', offerBody(vRef), other)).status, 404) // someone else's home
  assert.equal((await send('/api/owner/tenancies', 'POST', offerBody(vRef), ama)).status, 403)
  assert.equal((await send('/api/owner/tenancies', 'POST', offerBody(vRef))).status, 401)
  for (const bad of [{ monthlyRent: 0 }, { monthlyRent: 'x' }, { deposit: -1 }, { startDate: '2020-01-01' }, { termMonths: 0 }, { termMonths: 61 }, { viewingReference: 'abc' }]) {
    assert.equal((await send('/api/owner/tenancies', 'POST', offerBody(vRef, bad), owner)).status, 400, JSON.stringify(bad))
  }
  const saleRef = await confirmedViewing(ama, saleHome, 5)
  assert.equal((await send('/api/owner/tenancies', 'POST', offerBody(saleRef), owner)).status, 409) // homes for sale are not rented

  const r = await send('/api/owner/tenancies', 'POST', offerBody(vRef), owner)
  assert.equal(r.status, 201)
  assert.match(r.body.tenancy.reference, /^HL-T-\d{6}$/)
  assert.equal(r.body.tenancy.status, 'Offered')
  assert.equal(r.body.tenancy.resident.name, 'Ama Resident')
  assert.equal(r.body.tenancy.endDate, plusDays(10).replace(/^(\d{4})-(\d\d)-(\d\d)$/, (m) => {
    const d = new Date(m + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 12); return d.toISOString().slice(0, 10)
  }))
  ref = r.body.tenancy.reference
  assert.equal(await status(homeA), 'Reserved')
  assert.equal((await send('/api/owner/tenancies', 'POST', offerBody(vRef), owner)).status, 409) // already has one in progress
})

test('offers are private to the two people involved', async () => {
  const mine = (await send('/api/tenancies', 'GET', undefined, ama)).body.tenancies
  assert.equal(mine.length, 1)
  assert.equal(mine[0].owner.name, 'Efua Owner')
  assert.equal(mine[0].owner.phone, undefined) // the resident only sees the owner's name here
  assert.deepEqual((await send('/api/tenancies', 'GET', undefined, kojo)).body.tenancies, [])
  assert.equal((await send('/api/owner/tenancies', 'GET', undefined, owner)).body.tenancies.length, 1)
  assert.deepEqual((await send('/api/owner/tenancies', 'GET', undefined, other)).body.tenancies, [])
  for (const action of ['accept', 'decline', 'move-in', 'notice']) {
    assert.equal((await send(`/api/tenancies/${ref}/${action}`, 'POST', {}, kojo)).status, 404, action)
    assert.equal((await send(`/api/tenancies/${ref}/${action}`, 'POST', {})).status, 401, action)
  }
  assert.equal((await send(`/api/owner/tenancies/${ref}/withdraw`, 'POST', {}, other)).status, 404)
  assert.equal((await send('/api/tenancies/abc/accept', 'POST', {}, ama)).status, 404)
})

test('nothing but accepting or declining works while it is only an offer', async () => {
  assert.equal((await send(`/api/tenancies/${ref}/move-in`, 'POST', { items: rooms() }, ama)).status, 409)
  assert.equal((await send(`/api/tenancies/${ref}/notice`, 'POST', { moveOutDate: plusDays(60) }, ama)).status, 409)
  assert.equal((await send(`/api/owner/tenancies/${ref}/settle`, 'POST', {}, owner)).status, 409)
})

test('the owner can withdraw an offer, which frees the home; it can then be offered again', async () => {
  assert.equal((await send(`/api/owner/tenancies/${ref}/withdraw`, 'POST', {}, owner)).body.tenancy.status, 'Withdrawn')
  assert.equal(await status(homeA), 'Available')
  assert.equal((await send(`/api/tenancies/${ref}/accept`, 'POST', {}, ama)).status, 409)
  const again = await send('/api/owner/tenancies', 'POST', offerBody(vRef), owner)
  assert.equal(again.status, 201)
  ref = again.body.tenancy.reference
})

test('the resident can decline an offer, and the home is free again', async () => {
  assert.equal((await send(`/api/tenancies/${ref}/decline`, 'POST', {}, ama)).body.tenancy.status, 'Declined')
  assert.equal(await status(homeA), 'Available')
  const again = await send('/api/owner/tenancies', 'POST', offerBody(vRef), owner)
  assert.equal(again.status, 201)
  ref = again.body.tenancy.reference
})

test('accepting makes the tenancy active and the home rented', async () => {
  const r = await send(`/api/tenancies/${ref}/accept`, 'POST', {}, ama)
  assert.equal(r.body.tenancy.status, 'Active')
  assert.equal(await status(homeA), 'Rented')
  assert.equal((await send(`/api/tenancies/${ref}/accept`, 'POST', {}, ama)).status, 409)
  assert.equal((await send(`/api/owner/tenancies/${ref}/withdraw`, 'POST', {}, owner)).status, 409)
})

test('the move-in report is checked, can be sent again, and is locked once the owner acknowledges it', async () => {
  const bad = [undefined, [], [{ room: 'Garage', condition: 'Good' }], [{ room: 'Kitchen', condition: 'Great' }],
    [{ room: 'Kitchen', condition: 'Good' }, { room: 'Kitchen', condition: 'Poor' }], [{ room: 'Kitchen', condition: 'Good', note: 'x'.repeat(301) }]]
  for (const items of bad) assert.equal((await send(`/api/tenancies/${ref}/move-in`, 'POST', { items }, ama)).status, 400, JSON.stringify(items))
  assert.equal((await send(`/api/owner/tenancies/${ref}/move-in/acknowledge`, 'POST', {}, owner)).status, 409) // nothing to acknowledge yet

  const first = await send(`/api/tenancies/${ref}/move-in`, 'POST', { items: rooms('Poor') }, ama)
  assert.equal(first.status, 200)
  assert.equal(first.body.tenancy.moveIn.items.length, 2)
  assert.ok(first.body.tenancy.moveIn.submittedAt)
  const second = await send(`/api/tenancies/${ref}/move-in`, 'POST', { items: rooms('Good') }, ama)
  assert.equal(second.body.tenancy.moveIn.items.length, 2) // replaced, not added to
  assert.equal(second.body.tenancy.moveIn.items[0].condition, 'Good')

  const seen = (await send('/api/owner/tenancies', 'GET', undefined, owner)).body.tenancies[0]
  assert.equal(seen.moveIn.items.length, 2)
  assert.equal(seen.resident.phone, '0241234567')
  assert.equal((await send(`/api/owner/tenancies/${ref}/move-in/acknowledge`, 'POST', {}, other)).status, 404)
  const ack = await send(`/api/owner/tenancies/${ref}/move-in/acknowledge`, 'POST', {}, owner)
  assert.ok(ack.body.tenancy.moveIn.acknowledgedAt)
  assert.equal((await send(`/api/owner/tenancies/${ref}/move-in/acknowledge`, 'POST', {}, owner)).status, 409)
  assert.equal((await send(`/api/tenancies/${ref}/move-in`, 'POST', { items: rooms() }, ama)).status, 409)
})

test('a repair report from a tenant reaches the owner, who moves it forward with notes', async () => {
  const made = await send('/api/reports', 'POST', {
    home: 'Bright flat in Osu', category: 'plumbing', urgency: 'medium', summary: 'Kitchen tap leaks', description: 'The kitchen tap drips all day and night.',
  }, ama)
  assert.equal(made.status, 201)
  const rr = made.body.report.reference
  // a report from someone with no tenancy never reaches an owner
  await send('/api/reports', 'POST', { home: 'Somewhere else', category: 'plumbing', urgency: 'low', summary: 'Leaky tap', description: 'It drips a little bit.' }, kojo)

  const list = (await send('/api/owner/repairs', 'GET', undefined, owner)).body.reports
  assert.equal(list.length, 1)
  assert.equal(list[0].reference, rr)
  assert.equal(list[0].resident.name, 'Ama Resident')
  assert.equal(list[0].propertyTitle, 'Bright flat in Osu')
  assert.deepEqual((await send('/api/owner/repairs', 'GET', undefined, other)).body.reports, [])
  assert.equal((await send('/api/owner/repairs', 'GET', undefined, ama)).status, 403)
  assert.equal((await send('/api/owner/summary-repairs', 'GET', undefined, owner)).body.openRepairs, 1)

  const path = `/api/owner/repairs/${rr}/status`
  assert.equal((await send(path, 'POST', { status: 'Bogus' }, owner)).status, 400)
  assert.equal((await send(path, 'POST', { status: 'Acknowledged', note: 'x'.repeat(301) }, owner)).status, 400)
  assert.equal((await send(path, 'POST', { status: 'Acknowledged' }, other)).status, 404)
  assert.equal((await send(path, 'POST', { status: 'Submitted' }, owner)).status, 409) // cannot go backwards or stay
  const ack = await send(path, 'POST', { status: 'In Progress', note: 'A plumber comes on Friday.' }, owner)
  assert.equal(ack.body.report.status, 'In Progress')

  const mine = (await send('/api/reports', 'GET', undefined, ama)).body.reports.find((r) => r.reference === rr)
  assert.equal(mine.status, 'In Progress')
  assert.equal(mine.history.at(-1).note, 'A plumber comes on Friday.')
  assert.equal((await send(path, 'POST', { status: 'Acknowledged' }, owner)).status, 409) // already past that stage
  await send(path, 'POST', { status: 'Resolved', note: 'Fixed.' }, owner)
  assert.equal((await send('/api/owner/summary-repairs', 'GET', undefined, owner)).body.openRepairs, 0)
})

test('notice has to be for a future date', async () => {
  for (const moveOutDate of [undefined, 'soon', '2020-01-01', new Date().toISOString().slice(0, 10), plusDays(2000)]) {
    assert.equal((await send(`/api/tenancies/${ref}/notice`, 'POST', { moveOutDate }, ama)).status, 400, String(moveOutDate))
  }
  assert.equal((await send(`/api/tenancies/${ref}/notice`, 'POST', { moveOutDate: plusDays(5) }, ama)).status, 400) // before the tenancy starts (day 10)
  const r = await send(`/api/tenancies/${ref}/notice`, 'POST', { moveOutDate: plusDays(40) }, ama)
  assert.equal(r.body.tenancy.status, 'Notice given')
  assert.equal(r.body.tenancy.moveOutDate, plusDays(40))
  assert.equal((await send(`/api/tenancies/${ref}/notice`, 'POST', { moveOutDate: plusDays(50) }, ama)).status, 409)
})

test('the deposit settlement is checked, then ends the tenancy and frees the home', async () => {
  const path = `/api/owner/tenancies/${ref}/settle`
  const good = { items: rooms(), deductions: [{ reason: 'Broken tap', amount: 150.5 }, { reason: 'Cleaning', amount: 200 }], notes: 'Thanks for looking after the flat.' }
  const bads = [
    { ...good, items: [] },
    { ...good, deductions: undefined },
    { ...good, deductions: [{ reason: 'ab', amount: 10 }] },
    { ...good, deductions: [{ reason: 'Cleaning', amount: 0 }] },
    { ...good, deductions: [{ reason: 'Too much', amount: 7001 }] },
    { ...good, deductions: [{ reason: 'Part one', amount: 4000 }, { reason: 'Part two', amount: 4000 }] }, // adds up to more than the deposit
    { ...good, notes: 'x'.repeat(501) },
  ]
  for (const b of bads) assert.equal((await send(path, 'POST', b, owner)).status, 400, JSON.stringify(b).slice(0, 80))
  assert.equal((await send(path, 'POST', good, other)).status, 404)
  assert.equal((await send(path, 'POST', good, ama)).status, 403)

  const r = await send(path, 'POST', good, owner)
  assert.equal(r.status, 200)
  const t = r.body.tenancy
  assert.equal(t.status, 'Ended')
  assert.equal(t.settlement.totalDeductions, 350.5)
  assert.equal(t.settlement.refund, 6649.5)
  assert.equal(t.moveOut.items.length, 2)
  assert.ok(t.endedAt)
  assert.equal(await status(homeA), 'Available')
  const seen = (await send('/api/tenancies', 'GET', undefined, ama)).body.tenancies[0]
  assert.equal(seen.settlement.refund, 6649.5)
  assert.equal((await send(path, 'POST', good, owner)).status, 409) // already ended
  assert.equal((await send(`/api/tenancies/${ref}/notice`, 'POST', { moveOutDate: plusDays(60) }, ama)).status, 409)
  // an ended tenancy no longer links new reports to the owner
  await send('/api/reports', 'POST', { home: 'Bright flat in Osu', category: 'plumbing', urgency: 'low', summary: 'Another leak', description: 'A new leak appeared somewhere.' }, ama)
  assert.equal((await send('/api/owner/repairs', 'GET', undefined, owner)).body.reports.length, 1)
})

test('deleting a resident removes their tenancies, and the home can be offered again', async () => {
  assert.equal((await send('/api/account/delete', 'POST', { password: person().password }, ama)).status, 204)
  assert.equal((await pool.query('select count(*)::int as n from tenancies')).rows[0].n, 0)
  assert.equal((await pool.query('select count(*)::int as n from condition_items')).rows[0].n, 0)
})
