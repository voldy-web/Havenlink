import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import { startServer, call, person, pool } from './helpers.js'

let api
before(async () => { api = await startServer() })
after(() => api.close())

test('health check works and the database is reachable', async () => {
  assert.deepEqual((await call(api.base, '/api/health')).body.status, 'ok')
  assert.equal((await call(api.base, '/api/health/db')).body.database, 'connected')
})

test('unknown API paths give a JSON 404', async () => {
  const r = await call(api.base, '/api/nope')
  assert.equal(r.status, 404)
  assert.equal(r.body.error, 'Not found.')
})

test('register creates an account and returns a token, never the password', async () => {
  const r = await call(api.base, '/api/auth/register', { method: 'POST', body: person() })
  assert.equal(r.status, 201)
  assert.equal(r.body.user.email, 'ama@example.com')
  assert.equal(r.body.user.role, 'resident')
  assert.ok(r.body.token.split('.').length === 3)
  assert.ok(!JSON.stringify(r.body).includes('password'))
})

test('the password is stored only as a bcrypt hash', async () => {
  const { rows } = await pool.query("select password_hash from users where email = 'ama@example.com'")
  assert.notEqual(rows[0].password_hash, 'a-good-password')
  assert.ok(rows[0].password_hash.startsWith('$2'))
  assert.ok(await bcrypt.compare('a-good-password', rows[0].password_hash))
})

test('email is saved in lower case and duplicates (any case) are refused', async () => {
  const r = await call(api.base, '/api/auth/register', { method: 'POST', body: person({ email: 'AMA@Example.com', name: 'Other Ama' }) })
  assert.equal(r.status, 409)
  const r2 = await call(api.base, '/api/auth/register', { method: 'POST', body: person({ email: 'Kojo@Example.COM', name: 'Kojo Owner', role: 'owner' }) })
  assert.equal(r2.status, 201)
  assert.equal(r2.body.user.email, 'kojo@example.com')
})

test('register rejects bad input with per-field messages', async () => {
  const r = await call(api.base, '/api/auth/register', { method: 'POST', body: { name: 'A', email: 'nope', phone: '12', role: 'resident', password: 'short' } })
  assert.equal(r.status, 400)
  assert.deepEqual(Object.keys(r.body.fields).sort(), ['email', 'name', 'password', 'phone'])
})

test('nobody can register as admin or an unknown role', async () => {
  for (const role of ['admin', 'superuser', undefined, 42]) {
    const r = await call(api.base, '/api/auth/register', { method: 'POST', body: person({ email: `x${Math.random()}@example.com`, role }) })
    assert.equal(r.status, 400, `role ${role}`)
    assert.ok(r.body.fields.role)
  }
})

test('a password longer than 72 bytes is refused', async () => {
  const r = await call(api.base, '/api/auth/register', { method: 'POST', body: person({ email: 'long@example.com', password: 'x'.repeat(73) }) })
  assert.equal(r.status, 400)
})

test('login works with any email casing', async () => {
  const r = await call(api.base, '/api/auth/login', { method: 'POST', body: { email: 'AMA@example.com', password: 'a-good-password' } })
  assert.equal(r.status, 200)
  assert.equal(r.body.user.name, 'Ama Mensah')
  assert.ok(r.body.token)
})

test('wrong password and unknown email give the SAME error', async () => {
  const wrong = await call(api.base, '/api/auth/login', { method: 'POST', body: { email: 'ama@example.com', password: 'wrong-password' } })
  const unknown = await call(api.base, '/api/auth/login', { method: 'POST', body: { email: 'ghost@example.com', password: 'a-good-password' } })
  assert.equal(wrong.status, 401)
  assert.equal(unknown.status, 401)
  assert.equal(wrong.body.error, unknown.body.error)
})

test('login with missing or non-text fields is a 400', async () => {
  assert.equal((await call(api.base, '/api/auth/login', { method: 'POST', body: {} })).status, 400)
  assert.equal((await call(api.base, '/api/auth/login', { method: 'POST', body: { email: { $ne: '' }, password: 'x' } })).status, 400)
})

test('/me returns the signed-in user', async () => {
  const login = await call(api.base, '/api/auth/login', { method: 'POST', body: { email: 'ama@example.com', password: 'a-good-password' } })
  const me = await call(api.base, '/api/auth/me', { token: login.body.token })
  assert.equal(me.status, 200)
  assert.equal(me.body.user.email, 'ama@example.com')
})

test('/me refuses missing, garbage and forged tokens', async () => {
  assert.equal((await call(api.base, '/api/auth/me')).status, 401)
  assert.equal((await call(api.base, '/api/auth/me', { token: 'garbage' })).status, 401)
  const jwt = (await import('jsonwebtoken')).default
  const forged = jwt.sign({ sub: '00000000-0000-0000-0000-000000000000' }, 'some-other-secret')
  assert.equal((await call(api.base, '/api/auth/me', { token: forged })).status, 401)
})

test('a token for a deleted account stops working', async () => {
  const r = await call(api.base, '/api/auth/register', { method: 'POST', body: person({ email: 'temp@example.com' }) })
  await pool.query("delete from users where email = 'temp@example.com'")
  assert.equal((await call(api.base, '/api/auth/me', { token: r.body.token })).status, 401)
})

test('malformed JSON is a clean 400, not a crash', async () => {
  const r = await call(api.base, '/api/auth/login', { method: 'POST', body: '{"email": ', headers: { 'content-type': 'application/json' } })
  assert.equal(r.status, 400)
  assert.equal(r.body.error, 'Invalid JSON.')
})

test('CORS allows our website and not others; security headers are on', async () => {
  const good = await call(api.base, '/api/health', { headers: { origin: 'http://localhost:5173' } })
  assert.equal(good.headers.get('access-control-allow-origin'), 'http://localhost:5173')
  const bad = await call(api.base, '/api/health', { headers: { origin: 'https://evil.example' } })
  assert.equal(bad.headers.get('access-control-allow-origin'), null)
  assert.equal(good.headers.get('x-powered-by'), null)
  assert.equal(good.headers.get('x-content-type-options'), 'nosniff')
})
