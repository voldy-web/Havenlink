import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { generateKeyPairSync } from 'node:crypto'
import jwt from 'jsonwebtoken'

// A tiny stand-in for Google's key server, and our own key to sign "Google" tokens with.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const other = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' }
const keyServer = http.createServer((_req, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ keys: [jwk] })) })
await new Promise((r) => keyServer.listen(0, r))
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com'
process.env.GOOGLE_CERTS_URL = `http://127.0.0.1:${keyServer.address().port}/certs`

const { startServer, call, signUp, pool } = await import('./helpers.js')
const { createAdmin } = await import('../src/db/createAdmin.js')

let api
before(async () => { api = await startServer() })
after(async () => { await api.close(); keyServer.close() })

const idToken = (over = {}, key = privateKey, header = {}) => jwt.sign(
  { iss: 'https://accounts.google.com', aud: process.env.GOOGLE_CLIENT_ID, sub: 'g-111', email: 'kofi@example.com', email_verified: true, name: 'Kofi Google', ...over },
  key, { algorithm: 'RS256', keyid: 'test-key', ...(over.exp ? {} : { expiresIn: '1h' }), ...header },
)
const google = (credential, role) => call(api.base, '/api/auth/google', { method: 'POST', body: { credential, ...(role && { role }) } })

test('a token that is not from Google for this site is refused', async () => {
  for (const [label, token] of [
    ['wrong signing key', idToken({}, other.privateKey)],
    ['wrong audience', idToken({ aud: 'someone-elses-site' })],
    ['wrong issuer', idToken({ iss: 'https://evil.example.com' })],
    ['expired', idToken({ exp: Math.floor(Date.now() / 1000) - 60 })],
    ['unknown key id', idToken({}, privateKey, { keyid: 'other-key' })],
    ['garbage', 'not.a.token'],
  ]) assert.equal((await google(token, 'resident')).status, 401, label)
  assert.equal((await google(undefined, 'resident')).status, 401)
  assert.equal((await google(idToken({ email_verified: false }), 'resident')).status, 403) // unverified email
  assert.equal((await pool.query('select count(*)::int as n from users')).rows[0].n, 0)
})

test('someone with no account must pick an account type first', async () => {
  const r = await google(idToken())
  assert.equal(r.status, 404)
  assert.equal(r.body.code, 'no_account')
  assert.equal((await google(idToken(), 'admin')).status, 400) // admin is never self-serve
  assert.equal((await pool.query('select count(*)::int as n from users')).rows[0].n, 0)
})

test('signing up with Google creates an account with no password, and signs in next time', async () => {
  const made = await google(idToken(), 'owner')
  assert.equal(made.status, 201)
  assert.equal(made.body.created, true)
  assert.equal(made.body.user.role, 'owner')
  assert.equal(made.body.user.name, 'Kofi Google')
  assert.equal(made.body.user.hasPassword, false)
  assert.equal(made.body.user.password_hash, undefined)
  assert.equal((await call(api.base, '/api/auth/me', { token: made.body.token })).status, 200)

  const again = await google(idToken())
  assert.equal(again.status, 200)
  assert.equal(again.body.user.id, made.body.user.id)
  // an email-and-password login cannot get into a Google-only account
  assert.equal((await call(api.base, '/api/auth/login', { method: 'POST', body: { email: 'kofi@example.com', password: 'anything-at-all' } })).status, 401)
})

test('a Google-only account can choose a password without one to confirm, and delete itself with its email', async () => {
  const me = await google(idToken())
  const set = await call(api.base, '/api/account/password', { method: 'POST', token: me.body.token, body: { newPassword: 'my-first-password' } })
  assert.equal(set.status, 200)
  assert.equal(set.body.user.hasPassword, true)
  assert.equal((await call(api.base, '/api/auth/login', { method: 'POST', body: { email: 'kofi@example.com', password: 'my-first-password' } })).status, 200)
  // once it has a password, changing it needs the current one again
  assert.equal((await call(api.base, '/api/account/password', { method: 'POST', token: set.body.token, body: { newPassword: 'another-password-2' } })).status, 400)
})

test('a Google-only account is deleted by typing its email', async () => {
  const fresh = await google(idToken({ sub: 'g-222', email: 'esi@example.com', name: 'Esi' }), 'resident')
  assert.equal((await call(api.base, '/api/account/delete', { method: 'POST', token: fresh.body.token, body: { confirmEmail: 'wrong@example.com' } })).status, 400)
  assert.equal((await call(api.base, '/api/account/delete', { method: 'POST', token: fresh.body.token, body: {} })).status, 400)
  assert.equal((await call(api.base, '/api/account/delete', { method: 'POST', token: fresh.body.token, body: { confirmEmail: 'ESI@example.com' } })).status, 204)
})

test('using Google with an email that already has a password account links it, and wipes the old password', async () => {
  const old = await signUp(api.base, { name: 'Ama Mensah', email: 'ama@example.com' })
  await new Promise((r) => setTimeout(r, 1100)) // tokens are stamped to the second
  const r = await google(idToken({ sub: 'g-333', email: 'Ama@Example.com' }), 'resident')
  assert.equal(r.status, 200)
  assert.equal(r.body.linked, true)
  assert.equal(r.body.user.id, old.user.id)
  assert.equal((await call(api.base, '/api/auth/login', { method: 'POST', body: { email: 'ama@example.com', password: 'a-good-password' } })).status, 401) // the password is gone
  assert.equal((await call(api.base, '/api/auth/me', { token: old.token })).status, 401) // earlier logins are signed out
  assert.equal((await call(api.base, '/api/auth/me', { token: r.body.token })).status, 200)
  // "Forgot password" gives it a password back
  assert.equal((await call(api.base, '/api/auth/forgot', { method: 'POST', body: { email: 'ama@example.com' } })).status, 200)
})

test('admin accounts cannot be taken over through Google', async () => {
  await createAdmin({ email: 'admin@example.com', name: 'Site Admin', password: 'admin-password-1' })
  assert.equal((await google(idToken({ sub: 'g-444', email: 'admin@example.com' }), 'resident')).status, 403)
  assert.equal((await call(api.base, '/api/auth/login', { method: 'POST', body: { email: 'admin@example.com', password: 'admin-password-1' } })).status, 200)
})
