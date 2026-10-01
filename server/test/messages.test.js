import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, call, signUp } from './helpers.js'

let api, ama, kojo
before(async () => {
  api = await startServer()
  ama = await signUp(api.base, { name: 'Ama Mensah' })
  kojo = await signUp(api.base, { name: 'Kojo Owner' })
})
after(() => api.close())

const post = (path, body, who = ama) => call(api.base, path, { method: 'POST', body, token: who.token })
const get = (path, who = ama) => call(api.base, path, { token: who.token })
const agentChat = (over = {}) => ({ kind: 'agent', counterpartId: 1, counterpartName: 'Abena Owusu', subject: 'Question about the flat', propertyId: 4, body: 'Is it still available?', ...over })

test('messages need a signed-in user', async () => {
  assert.equal((await call(api.base, '/api/messages')).status, 401)
  assert.equal((await call(api.base, '/api/messages', { method: 'POST', body: agentChat() })).status, 401)
})

test('start a conversation with an agent and with support', async () => {
  const a = await post('/api/messages', agentChat())
  assert.equal(a.status, 201)
  assert.equal(a.body.conversation.counterpartName, 'Abena Owusu')
  assert.equal(a.body.conversation.propertyId, 4)
  const s = await post('/api/messages', { kind: 'support', subject: 'Help with my account', body: 'I need a hand', counterpartName: 'Someone Else', counterpartId: 9 })
  assert.equal(s.status, 201)
  assert.equal(s.body.conversation.counterpartName, 'Haven Link Support') // the server decides, not the browser
  assert.equal(s.body.conversation.counterpartId, null)
  const list = (await get('/api/messages')).body.conversations
  assert.equal(list.length, 2)
  assert.equal(list[0].lastBody, 'I need a hand')
  assert.equal(list[0].lastFromMe, true)
  assert.equal(list[0].unread, 0)
})

test('validation: kind, subject, body, agent fields', async () => {
  for (const bad of [
    agentChat({ kind: 'owner' }), agentChat({ subject: 'x' }), agentChat({ body: '   ' }), agentChat({ body: 'a'.repeat(2001) }),
    agentChat({ counterpartId: 0 }), agentChat({ counterpartName: '' }), agentChat({ propertyId: 'abc' }),
  ]) {
    assert.equal((await post('/api/messages', bad)).status, 400, JSON.stringify(bad).slice(0, 60))
  }
})

test('send, read back, unread counts and marking as read', async () => {
  const id = (await post('/api/messages', agentChat({ subject: 'Chat for reading' }))).body.conversation.id
  assert.equal((await post(`/api/messages/${id}/messages`, { body: 'Second message' })).status, 201)
  assert.equal((await post(`/api/messages/${id}/demo-reply`, {})).status, 201)
  let item = (await get('/api/messages')).body.conversations.find((c) => c.id === id)
  assert.equal(item.unread, 1)
  assert.equal(item.lastFromMe, false)
  const open = await get(`/api/messages/${id}`)
  assert.deepEqual(open.body.messages.map((m) => m.fromMe), [true, true, false])
  assert.equal(open.body.messages[0].body, 'Is it still available?')
  item = (await get('/api/messages')).body.conversations.find((c) => c.id === id)
  assert.equal(item.unread, 0)
})

test('messages stay private: other people get 404 and an empty list', async () => {
  const id = (await post('/api/messages', agentChat({ subject: 'Private chat' }))).body.conversation.id
  assert.equal((await get(`/api/messages/${id}`, kojo)).status, 404)
  assert.equal((await post(`/api/messages/${id}/messages`, { body: 'hello' }, kojo)).status, 404)
  assert.equal((await post(`/api/messages/${id}/demo-reply`, {}, kojo)).status, 404)
  assert.deepEqual((await get('/api/messages', kojo)).body.conversations, [])
  for (const bad of ['abc', '123', '../x']) assert.equal((await get(`/api/messages/${bad}`)).status, 404, bad)
})

test('sending needs a valid body', async () => {
  const id = (await post('/api/messages', agentChat({ subject: 'Validation chat' }))).body.conversation.id
  for (const body of ['', '   ', 5, null, 'a'.repeat(2001)]) assert.equal((await post(`/api/messages/${id}/messages`, { body })).status, 400, String(body).slice(0, 10))
})

test('messages are included in the data export and deleted with the account', async () => {
  const temp = await signUp(api.base)
  await post('/api/messages', agentChat({ subject: 'Temp chat' }), temp)
  const exported = (await call(api.base, '/api/account/export', { token: temp.token })).body
  assert.equal(exported.conversations.length, 1)
  assert.equal(exported.messages.length, 1)
  assert.equal((await call(api.base, '/api/account/delete', { method: 'POST', token: temp.token, body: { password: 'a-good-password' } })).status, 204)
  const { pool } = await import('./helpers.js')
  assert.equal((await pool.query('select count(*)::int as n from conversations where subject = $1', ['Temp chat'])).rows[0].n, 0)
})
