import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, call, signUp, person } from './helpers.js'

let api, ama, kojo
before(async () => {
  api = await startServer()
  ama = await signUp(api.base, { name: 'Ama Mensah' })
  kojo = await signUp(api.base, { name: 'Kojo Owner' })
})
after(() => api.close())

const send = (path, method, body, who = ama) => call(api.base, `/api/account${path}`, { method, body, token: who.token })
const details = (over = {}) => ({ name: 'Ama B. Mensah', phone: '0241112222', emergencyName: 'Yaw Mensah', emergencyPhone: '0205556666', ...over })

test('profile routes need a signed-in user', async () => {
  for (const [path, method] of [['/profile', 'PATCH'], ['/password', 'POST'], ['/export', 'GET'], ['/delete', 'POST']]) {
    assert.equal((await call(api.base, `/api/account${path}`, { method, ...(method !== 'GET' && { body: {} }) })).status, 401, path)
  }
})

test('profile: update name, phone, emergency contact and privacy', async () => {
  const privacy = { maskContact: false, anonymousReviews: true, residentDirectory: true }
  const r = await send('/profile', 'PATCH', { ...details(), privacy })
  assert.equal(r.status, 200)
  assert.equal(r.body.user.name, 'Ama B. Mensah')
  assert.equal(r.body.user.emergencyName, 'Yaw Mensah')
  assert.deepEqual(r.body.user.privacy, privacy)
  assert.equal(r.body.user.email, ama.user.email) // email cannot be changed here
  const me = await call(api.base, '/api/auth/me', { token: ama.token })
  assert.equal(me.body.user.phone, '0241112222')
  assert.equal(me.body.user.password_hash, undefined)
})

test('profile: rejects bad values and unknown privacy keys', async () => {
  const bad = await send('/profile', 'PATCH', details({ name: 'A', phone: '12' }))
  assert.equal(bad.status, 400)
  assert.ok(bad.body.fields.name && bad.body.fields.phone)
  assert.equal((await send('/profile', 'PATCH', details({ emergencyPhone: 'abc' }))).status, 400)
  assert.equal((await send('/profile', 'PATCH', { ...details(), privacy: { maskContact: 'yes' } })).status, 400)
  // blank emergency contact is allowed
  assert.equal((await send('/profile', 'PATCH', details({ emergencyName: '', emergencyPhone: '' }))).status, 200)
})

test('profile: cannot change email or role by sending them', async () => {
  const r = await send('/profile', 'PATCH', { ...details(), email: 'hacker@example.com', role: 'admin' })
  assert.equal(r.body.user.email, ama.user.email)
  assert.equal(r.body.user.role, 'resident')
})

test('password: wrong current password, weak new password, then success signs out old logins', async () => {
  assert.equal((await send('/password', 'POST', { currentPassword: 'nope-nope', newPassword: 'brand-new-pass-1' })).status, 400)
  assert.equal((await send('/password', 'POST', { currentPassword: person().password, newPassword: 'short' })).status, 400)
  assert.equal((await send('/password', 'POST', { currentPassword: person().password, newPassword: person().password })).status, 400)

  const ok = await send('/password', 'POST', { currentPassword: person().password, newPassword: 'brand-new-pass-1' })
  assert.equal(ok.status, 200)
  assert.ok(ok.body.token)
  // the old token no longer works; the fresh one does
  assert.equal((await call(api.base, '/api/auth/me', { token: ama.token })).status, 401)
  assert.equal((await call(api.base, '/api/auth/me', { token: ok.body.token })).status, 200)
  // and the new password works for sign-in, the old one does not
  const login = (password) => call(api.base, '/api/auth/login', { method: 'POST', body: { email: ama.user.email, password } })
  assert.equal((await login('brand-new-pass-1')).status, 200)
  assert.equal((await login(person().password)).status, 401)
  ama = { ...ama, token: ok.body.token }
})

test('export: returns my own data and never a password hash', async () => {
  await call(api.base, '/api/saved/7', { method: 'PUT', token: ama.token })
  await call(api.base, '/api/saved/8', { method: 'PUT', token: kojo.token })
  const r = await send('/export', 'GET')
  assert.equal(r.status, 200)
  assert.equal(r.body.account.email, ama.user.email)
  assert.deepEqual(r.body.savedHomes.map((s) => s.property_id), [7])
  assert.ok(!JSON.stringify(r.body).includes('password_hash'))
  assert.match(r.headers.get('content-disposition'), /attachment/)
})

test('delete: needs the right password, then removes the account and its data', async () => {
  assert.equal((await send('/delete', 'POST', { password: 'wrong-password' }, kojo)).status, 400)
  assert.equal((await call(api.base, '/api/auth/me', { token: kojo.token })).status, 200)
  assert.equal((await send('/delete', 'POST', { password: person().password }, kojo)).status, 204)
  assert.equal((await call(api.base, '/api/auth/me', { token: kojo.token })).status, 401)
  assert.equal((await call(api.base, '/api/auth/login', { method: 'POST', body: { email: kojo.user.email, password: person().password } })).status, 401)
})
