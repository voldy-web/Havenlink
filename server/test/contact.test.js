import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, call, signUp, person, tomorrow, pool } from './helpers.js'
import { createAdmin } from '../src/db/createAdmin.js'

let api, owner, other, ama, kojo, admin, homeId
before(async () => {
  api = await startServer()
  owner = await signUp(api.base, { name: 'Efua Owner', role: 'owner' })
  other = await signUp(api.base, { name: 'Yaw Other Owner', role: 'owner' })
  ama = await signUp(api.base, { name: 'Ama Resident' })
  kojo = await signUp(api.base, { name: 'Kojo Resident' })
  await createAdmin({ email: 'admin@example.com', name: 'Site Admin', password: 'admin-password-1' })
  admin = (await call(api.base, '/api/auth/login', { method: 'POST', body: { email: 'admin@example.com', password: 'admin-password-1' } })).body

  // Efua posts a home and the admin approves it.
  const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  const photo = (await send('/api/images', 'POST', { dataUrl: PNG }, owner)).body.image.key
  const made = await send('/api/owner/properties', 'POST', {
    title: 'Bright flat in Osu', description: 'A bright, quiet flat close to shops and transport, with a balcony.', address: '12 Oxford Street',
    area: 'Osu', city: 'Accra', listingType: 'rent', propertyType: 'apartment', price: 3500, beds: 2, baths: 1, sqm: 85,
    available: 'now', features: [], photos: [photo],
  }, owner)
  homeId = made.body.listing.id
  await send(`/api/admin/properties/${homeId}/approve`, 'POST', {}, admin)
})
after(() => api.close())

const send = (path, method, body, who) => call(api.base, path, { method, body, token: who?.token })
const writeTo = (propertyId, body = 'Is it still available?', who = ama, subject = 'About the flat in Osu') =>
  send('/api/messages', 'POST', { kind: 'owner', propertyId, subject, body }, who)

// ---------- messages with a real owner ----------
test('a resident can message the owner of a home, and the owner sees it', async () => {
  const r = await writeTo(homeId)
  assert.equal(r.status, 201)
  assert.equal(r.body.conversation.kind, 'owner')
  assert.equal(r.body.conversation.counterpartName, 'Efua Owner')
  assert.equal(r.body.conversation.youAre, 'starter')
  const id = r.body.conversation.id

  const ownerList = (await send('/api/messages', 'GET', undefined, owner)).body.conversations
  assert.equal(ownerList.length, 1)
  assert.equal(ownerList[0].counterpartName, 'Ama Resident') // the owner sees who wrote
  assert.equal(ownerList[0].youAre, 'recipient')
  assert.equal(ownerList[0].unread, 1)
  assert.equal(ownerList[0].lastFromMe, false)
  // the person who wrote sees nothing unread
  assert.equal((await send('/api/messages', 'GET', undefined, ama)).body.conversations[0].unread, 0)

  // the owner opens it: it is marked read, and fromMe is from the owner's point of view
  const opened = (await send(`/api/messages/${id}`, 'GET', undefined, owner)).body
  assert.deepEqual(opened.messages.map((m) => m.fromMe), [false])
  assert.equal((await send('/api/messages', 'GET', undefined, owner)).body.conversations[0].unread, 0)

  // the owner replies; the resident sees an unread reply
  assert.equal((await send(`/api/messages/${id}/messages`, 'POST', { body: 'Yes, it is. Would you like to view it?' }, owner)).status, 201)
  const mine = (await send('/api/messages', 'GET', undefined, ama)).body.conversations[0]
  assert.equal(mine.unread, 1)
  assert.equal(mine.lastFromMe, false)
  const read = (await send(`/api/messages/${id}`, 'GET', undefined, ama)).body
  assert.deepEqual(read.messages.map((m) => m.fromMe), [true, false])
  assert.equal((await send('/api/messages', 'GET', undefined, ama)).body.conversations[0].unread, 0)
  assert.equal((await send('/api/messages', 'GET', undefined, owner)).body.conversations[0].unread, 0) // the owner's own reply is not "unread"
})

test('writing to the same home again continues the same conversation', async () => {
  const first = (await send('/api/messages', 'GET', undefined, ama)).body.conversations[0].id
  const again = await writeTo(homeId, 'Also, is parking included?')
  assert.equal(again.status, 200)
  assert.equal(again.body.conversation.id, first)
  const opened = (await send(`/api/messages/${first}`, 'GET', undefined, ama)).body
  assert.equal(opened.messages.length, 3)
  assert.equal((await send('/api/messages', 'GET', undefined, ama)).body.conversations.length, 1)
})

test('who can and cannot start a conversation with an owner', async () => {
  assert.equal((await writeTo(homeId, 'Hello', owner)).status, 400) // not with yourself
  assert.equal((await writeTo(1)).status, 400) // starter homes use their sample agents
  assert.equal((await writeTo(999999)).status, 400)
  assert.equal((await writeTo('abc')).status, 400)
  assert.equal((await writeTo(homeId, '   ')).status, 400)
  assert.equal((await send('/api/messages', 'POST', { kind: 'owner', subject: 'Hi there', body: 'Hello' }, ama)).status, 400)
  assert.equal((await send('/api/messages', 'POST', { kind: 'owner', propertyId: homeId, subject: 'Hi there', body: 'Hello' })).status, 401)
  // a home that is not live cannot be written to
  await send(`/api/owner/properties/${homeId}/pause`, 'POST', {}, owner)
  assert.equal((await writeTo(homeId, 'Hello', kojo)).status, 400)
  await send(`/api/owner/properties/${homeId}/resume`, 'POST', {}, owner)
})

test('conversations stay private to the two people in them', async () => {
  const id = (await send('/api/messages', 'GET', undefined, ama)).body.conversations[0].id
  for (const who of [kojo, other]) {
    assert.equal((await send(`/api/messages/${id}`, 'GET', undefined, who)).status, 404)
    assert.equal((await send(`/api/messages/${id}/messages`, 'POST', { body: 'hello' }, who)).status, 404)
  }
  assert.deepEqual((await send('/api/messages', 'GET', undefined, other)).body.conversations, [])
  assert.deepEqual((await send('/api/messages', 'GET', undefined, kojo)).body.conversations, [])
})

test('the demo reply never speaks for a real owner', async () => {
  const id = (await send('/api/messages', 'GET', undefined, ama)).body.conversations[0].id
  assert.equal((await send(`/api/messages/${id}/demo-reply`, 'POST', {}, ama)).status, 400)
})

test('the data export includes conversations from both sides', async () => {
  const mineAsOwner = (await send('/api/account/export', 'GET', undefined, owner)).body
  assert.equal(mineAsOwner.conversations.length, 1)
  assert.ok(mineAsOwner.messages.length >= 3)
})

// ---------- viewing requests ----------
const book = (who = ama, over = {}) => send('/api/viewings', 'POST', {
  propertyId: homeId, propertyTitle: 'Bright flat in Osu', format: 'in-person', date: tomorrow(), time: '11:00 AM', attendees: 2,
  name: 'Ama Resident', phone: '0241234567', email: 'ama@example.com', ...over,
}, who)
const ownerViewings = (who = owner) => send('/api/owner/viewings', 'GET', undefined, who)
const act = (reference, action, body = {}, who = owner) => send(`/api/owner/viewings/${reference}/${action}`, 'POST', body, who)
const plusDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)

test('the owner sees viewing requests for their home with the visitor’s details, and nobody else does', async () => {
  const v = await book()
  assert.equal(v.status, 201)
  assert.equal(v.body.viewing.status, 'Pending')
  const list = (await ownerViewings()).body.viewings
  assert.equal(list.length, 1)
  assert.equal(list[0].reference, v.body.viewing.reference)
  assert.deepEqual(list[0].client, { name: 'Ama Resident', phone: '0241234567', email: 'ama@example.com' })
  assert.deepEqual((await ownerViewings(other)).body.viewings, [])
  assert.equal((await ownerViewings(ama)).status, 403)
  assert.equal((await ownerViewings(admin)).status, 403)
  assert.equal((await send('/api/owner/viewings', 'GET')).status, 401)
  assert.equal((await send('/api/owner/summary', 'GET', undefined, owner)).body.pendingViewings, 1)
  // a viewing of a starter home never reaches an owner
  await book(kojo, { propertyId: 1, propertyTitle: 'Starter home' })
  assert.equal((await ownerViewings()).body.viewings.length, 1)
})

test('the owner confirms, and the visitor sees the answer', async () => {
  const ref = (await ownerViewings()).body.viewings[0].reference
  const r = await act(ref, 'confirm', { note: 'See you at the gate.' })
  assert.equal(r.status, 200)
  assert.equal(r.body.viewing.status, 'Confirmed')
  const seen = (await send('/api/viewings', 'GET', undefined, ama)).body.viewings.find((x) => x.reference === ref)
  assert.equal(seen.status, 'Confirmed')
  assert.equal(seen.ownerNote, 'See you at the gate.')
  assert.ok(seen.respondedAt)
  assert.equal((await send('/api/owner/summary', 'GET', undefined, owner)).body.pendingViewings, 0)
  assert.equal((await act(ref, 'confirm')).status, 409) // already confirmed
})

test('suggesting another time: validated, saved, and visible to the visitor', async () => {
  const ref = (await ownerViewings()).body.viewings[0].reference
  for (const bad of [{ date: '2020-01-01', time: '10:00 AM' }, { date: plusDays(3), time: 'noon' }, { time: '10:00 AM' }, {}]) {
    assert.equal((await act(ref, 'reschedule', bad)).status, 400, JSON.stringify(bad))
  }
  const r = await act(ref, 'reschedule', { date: plusDays(3), time: '3:00 PM', note: 'Tuesday works better for me.' })
  assert.equal(r.body.viewing.status, 'Rescheduled')
  assert.equal(r.body.viewing.time, '3:00 PM')
  assert.equal(r.body.viewing.date, plusDays(3))
  const seen = (await send('/api/viewings', 'GET', undefined, ama)).body.viewings.find((x) => x.reference === ref)
  assert.equal(seen.status, 'Rescheduled')
  assert.equal(seen.time, '3:00 PM')
})

test('a new time that clashes with the visitor’s own booking is refused', async () => {
  const mine = (await book(ama, { date: plusDays(5), time: '9:30 AM' })).body.viewing
  assert.equal((await act(mine.reference, 'reschedule', { date: plusDays(3), time: '3:00 PM' })).status, 409) // taken by the first viewing
})

test('declining needs a reason; other owners cannot act on someone else’s request', async () => {
  const ref = (await ownerViewings()).body.viewings.find((v) => v.status === 'Pending').reference
  assert.equal((await act(ref, 'decline', {})).status, 400)
  assert.equal((await act(ref, 'decline', { note: 'x' })).status, 400)
  assert.equal((await act(ref, 'confirm', {}, other)).status, 404)
  assert.equal((await act(ref, 'decline', { note: 'Not available then.' }, other)).status, 404)
  assert.equal((await act(ref, 'confirm', {}, ama)).status, 403)
  assert.equal((await act('HL-V-000000', 'confirm')).status, 404)
  assert.equal((await act('abc', 'confirm')).status, 404)
  assert.equal((await act(ref, 'decline', { note: 'Not available then.' })).body.viewing.status, 'Declined')
  assert.equal((await act(ref, 'confirm')).status, 409) // declined stays declined
  assert.equal((await send(`/api/viewings/${ref}/cancel`, 'PATCH', undefined, ama)).status, 409) // and cannot be cancelled either
})

test('the visitor can still cancel a confirmed viewing', async () => {
  const ref = (await book(ama, { date: plusDays(8), time: '6:00 PM' })).body.viewing.reference
  await act(ref, 'confirm')
  assert.equal((await send(`/api/viewings/${ref}/cancel`, 'PATCH', undefined, ama)).body.viewing.status, 'Cancelled')
  assert.equal((await act(ref, 'confirm')).status, 409)
})

test('deleting the owner’s account removes their conversations', async () => {
  assert.equal((await send('/api/account/delete', 'POST', { password: person().password }, owner)).status, 204)
  assert.deepEqual((await send('/api/messages', 'GET', undefined, ama)).body.conversations, [])
  assert.equal((await pool.query('select count(*)::int as n from conversations where owner_id is not null')).rows[0].n, 0)
})
