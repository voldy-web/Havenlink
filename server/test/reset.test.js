import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, call, signUp, pool } from './helpers.js'
import { outbox } from '../src/utils/mailer.js'

let api, ama
before(async () => {
  api = await startServer()
  ama = await signUp(api.base, { name: 'Ama Mensah' })
})
after(() => api.close())

const send = (path, body, token) => call(api.base, path, { method: 'POST', body, token })
const linkToken = (mail) => mail.text.match(/token=([0-9a-f]{64})/)[1]

test('asking for a reset gives the same answer whether or not the email has an account', async () => {
  const known = await send('/api/auth/forgot', { email: ama.user.email })
  const unknown = await send('/api/auth/forgot', { email: 'nobody@example.com' })
  assert.equal(known.status, 200)
  assert.deepEqual(known.body, unknown.body)
  assert.equal(outbox.filter((m) => m.to === 'nobody@example.com').length, 0)
  assert.equal(outbox.filter((m) => m.to === ama.user.email).length, 1)
  assert.equal((await send('/api/auth/forgot', { email: 'not an email' })).status, 400)
  assert.equal((await send('/api/auth/forgot', {})).status, 400)
})

test('the emailed link is stored only as a hash', async () => {
  const token = linkToken(outbox.at(-1))
  const { rows } = await pool.query('select token_hash from password_resets')
  assert.equal(rows.length, 1)
  assert.notEqual(rows[0].token_hash, token)
  assert.match(outbox.at(-1).text, /\/reset-password\?token=/)
})

test('a new request replaces the older link', async () => {
  const first = linkToken(outbox.at(-1))
  await send('/api/auth/forgot', { email: ama.user.email })
  const second = linkToken(outbox.at(-1))
  assert.notEqual(first, second)
  assert.equal((await send('/api/auth/reset', { token: first, password: 'brand-new-pass-1' })).status, 400)
})

test('a bad token or a weak password is refused', async () => {
  const token = linkToken(outbox.at(-1))
  assert.equal((await send('/api/auth/reset', { token: 'abc', password: 'brand-new-pass-1' })).status, 400)
  assert.equal((await send('/api/auth/reset', { token: 'a'.repeat(64), password: 'brand-new-pass-1' })).status, 400)
  assert.equal((await send('/api/auth/reset', { token, password: 'short' })).status, 400)
  assert.equal((await send('/api/auth/reset', { token })).status, 400)
  // still usable after those failures
  assert.equal((await pool.query('select count(*)::int as n from password_resets')).rows[0].n, 1)
})

test('choosing a new password works once, signs out old logins, and the old password stops working', async () => {
  const token = linkToken(outbox.at(-1))
  assert.equal((await call(api.base, '/api/auth/me', { token: ama.token })).status, 200)
  await new Promise((r) => setTimeout(r, 1100)) // tokens are stamped to the second
  const r = await send('/api/auth/reset', { token, password: 'brand-new-pass-1' })
  assert.equal(r.status, 200)
  assert.equal((await send('/api/auth/reset', { token, password: 'another-pass-22' })).status, 400) // one use only
  assert.equal((await call(api.base, '/api/auth/me', { token: ama.token })).status, 401) // old login is signed out
  assert.equal((await send('/api/auth/login', { email: ama.user.email, password: 'a-good-password' })).status, 401)
  assert.equal((await send('/api/auth/login', { email: ama.user.email, password: 'brand-new-pass-1' })).status, 200)
})

test('an expired link is refused', async () => {
  await send('/api/auth/forgot', { email: ama.user.email })
  const token = linkToken(outbox.at(-1))
  await pool.query("update password_resets set expires_at = now() - interval '1 minute'")
  const r = await send('/api/auth/reset', { token, password: 'yet-another-pass-3' })
  assert.equal(r.status, 400)
  assert.match(r.body.error, /expired/)
})

test('deleting the account removes its reset links', async () => {
  await send('/api/auth/forgot', { email: ama.user.email })
  const login = (await send('/api/auth/login', { email: ama.user.email, password: 'brand-new-pass-1' })).body
  assert.equal((await send('/api/account/delete', { password: 'brand-new-pass-1' }, login.token)).status, 204)
  assert.equal((await pool.query('select count(*)::int as n from password_resets')).rows[0].n, 0)
})
