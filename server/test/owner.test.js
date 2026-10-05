import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, call, signUp, person, pool } from './helpers.js'
import { createAdmin } from '../src/db/createAdmin.js'

let api, owner, other, resident, admin
before(async () => {
  api = await startServer()
  owner = await signUp(api.base, { name: 'Efua Owner', role: 'owner' })
  other = await signUp(api.base, { name: 'Kojo Owner', role: 'owner' })
  resident = await signUp(api.base, { name: 'Ama Resident' })
  await createAdmin({ email: 'admin@example.com', name: 'Site Admin', password: 'admin-password-1' })
  admin = (await call(api.base, '/api/auth/login', { method: 'POST', body: { email: 'admin@example.com', password: 'admin-password-1' } })).body
})
after(() => api.close())

const send = (path, method, body, who) => call(api.base, path, { method, body, token: who?.token })
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const asUrl = (type, bytes) => `data:${type};base64,${Buffer.from(bytes).toString('base64')}`
const upload = async (who = owner, dataUrl = PNG) => send('/api/images', 'POST', { dataUrl }, who)
const photo = async (who = owner) => (await upload(who)).body.image.key
const form = async (over = {}) => ({
  title: 'Bright two-bedroom flat in Osu', description: 'A bright, quiet flat close to shops and transport, with a balcony.',
  address: '12 Oxford Street', area: 'Osu', city: 'Accra', listingType: 'rent', propertyType: 'apartment', price: 3500,
  beds: 2, baths: 1, sqm: 85, available: 'now', features: ['ac', 'balcony'], photos: [await photo()], ...over,
})
const create = async (over, who = owner) => send('/api/owner/properties', 'POST', await form(over), who)

test('only admins can be made by the script, and the password is checked', async () => {
  assert.equal(admin.user.role, 'admin')
  await assert.rejects(() => createAdmin({ email: 'bad', name: 'X Y', password: 'long-enough-1' }))
  await assert.rejects(() => createAdmin({ email: 'a@b.co', name: 'X Y', password: 'short' }))
  assert.equal((await send('/api/auth/register', 'POST', person({ email: 'x@example.com', role: 'admin' }))).status, 400) // no self-service admin
})

// ---------- photos ----------
test('photos: owners can upload, residents cannot, and anyone can view them', async () => {
  assert.equal((await upload(resident)).status, 403)
  assert.equal((await send('/api/images', 'POST', { dataUrl: PNG })).status, 401)
  const r = await upload()
  assert.equal(r.status, 201)
  assert.match(r.body.image.key, /^upload:\d+$/)
  const file = await fetch(`${api.base}/api/images/${r.body.image.id}`)
  assert.equal(file.status, 200)
  assert.equal(file.headers.get('content-type'), 'image/png')
  assert.equal(file.headers.get('cross-origin-resource-policy'), 'cross-origin')
  assert.match(file.headers.get('cache-control'), /immutable/)
  assert.equal((await file.arrayBuffer()).byteLength, Buffer.from(PNG.split(',')[1], 'base64').length)
  for (const id of ['999999', '0', 'abc', '-1']) assert.equal((await fetch(`${api.base}/api/images/${id}`)).status, 404, id)
})

test('photos: wrong types, fake files and big files are refused', async () => {
  for (const bad of [
    'data:image/gif;base64,R0lGODlhAQABAAAAACw=', 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', 'data:text/html;base64,PGI+PC9iPg==',
    'not a data url', asUrl('image/png', Buffer.from('this is not a png')), asUrl('image/jpeg', Buffer.from('plain text')),
    asUrl('image/jpeg', Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(710_000)])),
  ]) {
    assert.equal((await upload(owner, bad)).status, 400, bad.slice(0, 40))
  }
  assert.equal((await send('/api/images', 'POST', {}, owner)).status, 400)
  const jpeg = asUrl('image/jpeg', Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200)]))
  assert.equal((await upload(owner, jpeg)).status, 201)
  const webp = asUrl('image/webp', Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(50)]))
  assert.equal((await upload(owner, webp)).status, 201)
})

// ---------- listings ----------
test('only owners can post homes', async () => {
  assert.equal((await send('/api/owner/properties', 'POST', await form(), resident)).status, 403)
  assert.equal((await send('/api/owner/properties', 'GET')).status, 401)
  assert.equal((await send('/api/owner/properties', 'GET', undefined, admin)).status, 403)
})

test('a new home waits for review and is hidden from the public until approved', async () => {
  const r = await create()
  assert.equal(r.status, 201)
  const { id, reviewStatus } = r.body.listing
  assert.equal(reviewStatus, 'pending')
  assert.ok(id >= 1000)
  assert.equal(r.body.listing.listing.agentId, null)
  assert.equal(r.body.listing.listing.ownerName, 'Efua Owner')
  assert.equal((await call(api.base, `/api/properties/${id}`)).status, 404)
  assert.ok(!(await call(api.base, '/api/properties')).body.properties.some((p) => p.id === id))
  assert.equal((await send('/api/owner/properties', 'GET', undefined, owner)).body.listings.some((l) => l.id === id), true)

  // admin approves: now public
  const ok = await send(`/api/admin/properties/${id}/approve`, 'POST', {}, admin)
  assert.equal(ok.status, 200)
  const pub = await call(api.base, `/api/properties/${id}`)
  assert.equal(pub.status, 200)
  assert.equal(pub.body.property.title, 'Bright two-bedroom flat in Osu')
  assert.equal(pub.body.property.price, 3500)
  assert.match(pub.body.property.image, /^upload:\d+$/)
  assert.ok((await call(api.base, '/api/properties')).body.properties.some((p) => p.id === id))
  assert.equal((await send(`/api/admin/properties/${id}/approve`, 'POST', {}, admin)).status, 409) // not waiting any more
})

test('the newest owner homes are listed before the starter homes', async () => {
  const first = await create({ title: 'Older owner home' })
  const second = await create({ title: 'Newer owner home' })
  for (const r of [first, second]) await send(`/api/admin/properties/${r.body.listing.id}/approve`, 'POST', {}, admin)
  const list = (await call(api.base, '/api/properties')).body.properties
  const ids = list.map((p) => p.id)
  assert.ok(ids.indexOf(second.body.listing.id) < ids.indexOf(first.body.listing.id))
  assert.ok(ids.indexOf(first.body.listing.id) < ids.indexOf(1))
  assert.deepEqual(ids.filter((id) => id < 1000), [...ids.filter((id) => id < 1000)].sort((a, b) => a - b)) // starter homes keep their order
})

test('listing validation', async () => {
  const stranger = await photo(other)
  for (const bad of [
    { title: 'x' }, { description: 'too short' }, { address: '' }, { area: '' }, { city: '' },
    { listingType: 'lease' }, { propertyType: 'castle' }, { price: 0 }, { price: -5 }, { price: '3500' },
    { beds: -1 }, { beds: 1.5 }, { baths: 99 }, { sqm: 1 }, { available: 'someday' },
    { features: ['ac', 'jacuzzi'] }, { features: ['ac', 'ac'] }, { photos: [] }, { photos: ['upload:99999999'] },
    { photos: ['https://evil.example/x.jpg'] }, { photos: [stranger] }, // someone else's photo
    { lat: 5.6 }, { lat: 500, lng: 1 },
  ]) {
    const r = await create(bad)
    assert.equal(r.status, 400, JSON.stringify(bad))
  }
  const withMap = await create({ lat: 5.56, lng: -0.19 })
  assert.equal(withMap.status, 201)
  assert.equal(withMap.body.listing.listing.lat, 5.56)
})

test('only unknown fields are dropped: owners cannot set featured, verified, status or the agent', async () => {
  const r = await create({ featured: true, verified: true, status: 'Sold', agentId: 3, badge: 'Hacked', source: 'seed', review_status: 'approved' })
  const l = r.body.listing
  assert.equal(l.reviewStatus, 'pending')
  assert.equal(l.listing.featured, false)
  assert.equal(l.listing.verified, false)
  assert.equal(l.listing.status, 'Available')
  assert.equal(l.listing.agentId, null)
  assert.equal(l.listing.badge, 'New')
})

test('review: rejecting needs a reason, the owner sees it, and editing sends it back for review', async () => {
  const id = (await create({ title: 'Home to reject' })).body.listing.id
  assert.equal((await send(`/api/admin/properties/${id}/reject`, 'POST', { note: '' }, admin)).status, 400)
  assert.equal((await send(`/api/admin/properties/${id}/reject`, 'POST', { note: 'Photos are too dark.' }, admin)).status, 200)
  const seen = (await send(`/api/owner/properties/${id}`, 'GET', undefined, owner)).body.listing
  assert.equal(seen.reviewStatus, 'rejected')
  assert.equal(seen.reviewNote, 'Photos are too dark.')
  assert.equal((await call(api.base, `/api/properties/${id}`)).status, 404)

  const edited = await send(`/api/owner/properties/${id}`, 'PUT', await form({ title: 'Home with better photos' }), owner)
  assert.equal(edited.status, 200)
  assert.equal(edited.body.listing.reviewStatus, 'pending')
  assert.equal(edited.body.listing.reviewNote, '')
  assert.equal(edited.body.listing.listing.title, 'Home with better photos')
})

test('editing a live home hides it again until it is re-approved; pause and resume', async () => {
  const id = (await create({ title: 'Live home' })).body.listing.id
  await send(`/api/admin/properties/${id}/approve`, 'POST', {}, admin)
  assert.equal((await call(api.base, `/api/properties/${id}`)).status, 200)

  assert.equal((await send(`/api/owner/properties/${id}/pause`, 'POST', {}, owner)).body.listing.reviewStatus, 'paused')
  assert.equal((await call(api.base, `/api/properties/${id}`)).status, 404)
  assert.equal((await send(`/api/owner/properties/${id}/pause`, 'POST', {}, owner)).status, 409)
  assert.equal((await send(`/api/owner/properties/${id}/resume`, 'POST', {}, owner)).body.listing.reviewStatus, 'approved')
  assert.equal((await call(api.base, `/api/properties/${id}`)).status, 200)

  await send(`/api/owner/properties/${id}`, 'PUT', await form({ title: 'Live home, changed' }), owner)
  assert.equal((await call(api.base, `/api/properties/${id}`)).status, 404)
  assert.equal((await send(`/api/owner/properties/${id}/resume`, 'POST', {}, owner)).status, 409) // pending cannot be resumed
})

test('owners can only touch their own homes', async () => {
  const id = (await create({ title: 'Efua only' })).body.listing.id
  assert.equal((await send(`/api/owner/properties/${id}`, 'GET', undefined, other)).status, 404)
  assert.equal((await send(`/api/owner/properties/${id}`, 'PUT', await form({}), other)).status, 404)
  assert.equal((await send(`/api/owner/properties/${id}/pause`, 'POST', {}, other)).status, 404)
  assert.equal((await send(`/api/owner/properties/${id}`, 'DELETE', undefined, other)).status, 404)
  assert.ok(!(await send('/api/owner/properties', 'GET', undefined, other)).body.listings.some((l) => l.id === id))
  // and the seeded starter homes are not theirs to edit
  assert.equal((await send('/api/owner/properties/1', 'PUT', await form({}), owner)).status, 404)
  for (const bad of ['abc', '0', '-1', '99999999999']) assert.equal((await send(`/api/owner/properties/${bad}`, 'GET', undefined, owner)).status, 404, bad)
})

test('deleting a home removes its photos too', async () => {
  const key = await photo()
  const imageId = Number(key.split(':')[1])
  const id = (await create({ photos: [key], title: 'Home to delete' })).body.listing.id
  assert.equal((await fetch(`${api.base}/api/images/${imageId}`)).status, 200)
  assert.equal((await send(`/api/owner/properties/${id}`, 'DELETE', undefined, owner)).status, 204)
  assert.equal((await fetch(`${api.base}/api/images/${imageId}`)).status, 404)
  assert.equal((await send(`/api/owner/properties/${id}`, 'GET', undefined, owner)).status, 404)
})

test('swapping a photo while editing deletes the old one', async () => {
  const first = await photo(); const second = await photo()
  const id = (await create({ photos: [first] })).body.listing.id
  await send(`/api/owner/properties/${id}`, 'PUT', await form({ photos: [second] }), owner)
  assert.equal((await fetch(`${api.base}/api/images/${first.split(':')[1]}`)).status, 404)
  assert.equal((await fetch(`${api.base}/api/images/${second.split(':')[1]}`)).status, 200)
})

// ---------- admin ----------
test('the admin queue is for admins only', async () => {
  for (const who of [owner, resident, undefined]) {
    assert.equal((await send('/api/admin/properties', 'GET', undefined, who)).status, who ? 403 : 401)
  }
  const q = await send('/api/admin/properties', 'GET', undefined, admin)
  assert.equal(q.status, 200)
  assert.ok(q.body.listings.every((l) => l.reviewStatus === 'pending' && l.owner.email))
  assert.equal((await send('/api/admin/properties?status=bogus', 'GET', undefined, admin)).status, 400)
  const all = (await send('/api/admin/properties?status=all', 'GET', undefined, admin)).body.listings
  assert.ok(all.length > q.body.listings.length)
  assert.ok(all.every((l) => l.id >= 1000)) // starter homes are not in the owner review queue
  assert.equal((await send(`/api/admin/properties/${all[0].id}`, 'GET', undefined, admin)).status, 200)
  assert.equal((await send('/api/admin/properties/1/approve', 'POST', {}, admin)).status, 404)
  assert.equal((await send('/api/admin/properties/abc/approve', 'POST', {}, admin)).status, 404)
})

test('deleting an owner account removes their homes and photos', async () => {
  const temp = await signUp(api.base, { role: 'owner' })
  const key = await photo(temp)
  const id = (await create({ photos: [key] }, temp)).body.listing.id
  await send(`/api/admin/properties/${id}/approve`, 'POST', {}, admin)
  assert.equal((await call(api.base, `/api/properties/${id}`)).status, 200)
  assert.equal((await send('/api/account/delete', 'POST', { password: person().password }, temp)).status, 204)
  assert.equal((await fetch(`${api.base}/api/images/${key.split(':')[1]}`)).status, 404)
  // the home goes with the account
  assert.equal((await call(api.base, `/api/properties/${id}`)).status, 404)
  assert.equal((await pool.query('select count(*)::int as n from properties where id = $1', [id])).rows[0].n, 0)
})
