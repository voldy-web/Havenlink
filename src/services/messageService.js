// Messages with property agents and Haven Link Support. Two modes, chosen by
// services/api.js: with VITE_API_URL they are stored on the server (private to
// your account); in demo mode they live in this browser (localStorage).
// Agents and support cannot sign in yet, so replies come from the demo tool.
import { apiEnabled, apiOrThrow } from './api'

export const SUPPORT_NAME = 'Haven Link Support'
const KEY = 'havenlink_messages'
export const MAX_LENGTH = 2000

// ---- Demo mode (browser only) ----
const replies = {
  agent: [
    'Hello, thanks for your interest in the property. It is still available. Would you like to book a viewing?',
    'Of course. I can show you around this week. Which day and time suit you best?',
    'Thank you. I have noted that down and will confirm shortly.',
  ],
  support: [
    'Hello, thanks for contacting Haven Link. How can we help?',
    'Thank you for the details. We are looking into it and will update you here.',
    'Is there anything else we can help you with?',
  ],
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}
function writeAll(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Storage blocked (private mode): the chat still shows until the page is closed.
  }
}
const newId = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
const summary = ({ messages, ...c }) => {
  const last = messages[messages.length - 1]
  return { ...c, lastBody: last?.body ?? '', lastFromMe: last?.fromMe ?? true, unread: messages.filter((m) => !m.fromMe && !m.read).length }
}
const byRecent = (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)

async function demoList() {
  return readAll().map(summary).sort(byRecent)
}

async function demoOpen(id) {
  const all = readAll()
  const found = all.find((c) => c.id === id)
  if (!found) throw new Error('Conversation not found.')
  found.messages.forEach((m) => { m.read = true })
  writeAll(all)
  const { messages, ...conversation } = found
  return { conversation, messages }
}

async function demoCreate(d) {
  const now = new Date().toISOString()
  const conversation = {
    id: newId(), kind: d.kind, counterpartId: d.kind === 'agent' ? d.counterpartId : null,
    counterpartName: d.kind === 'agent' ? d.counterpartName : SUPPORT_NAME, subject: d.subject.trim(),
    propertyId: d.kind === 'agent' ? d.propertyId ?? null : null, createdAt: now, lastMessageAt: now,
    messages: [{ id: 1, fromMe: true, body: d.body.trim(), createdAt: now, read: true }],
  }
  writeAll([conversation, ...readAll()])
  return summary(conversation)
}

async function demoSend(id, body) {
  const all = readAll()
  const c = all.find((x) => x.id === id)
  if (!c) throw new Error('Conversation not found.')
  const message = { id: c.messages.length + 1, fromMe: true, body: body.trim(), createdAt: new Date().toISOString(), read: true }
  c.messages.push(message)
  c.lastMessageAt = message.createdAt
  writeAll(all)
  return message
}

async function demoReplyFrom(id) {
  const all = readAll()
  const c = all.find((x) => x.id === id)
  if (!c) throw new Error('Conversation not found.')
  const list = replies[c.kind]
  const message = { id: c.messages.length + 1, fromMe: false, body: list[c.messages.filter((m) => !m.fromMe).length % list.length], createdAt: new Date().toISOString(), read: false }
  c.messages.push(message)
  c.lastMessageAt = message.createdAt
  writeAll(all)
  return message
}

// ---- What the pages use ----
export const listConversations = () => (apiEnabled ? apiOrThrow('/messages').then((d) => d.conversations) : demoList())
export const openConversation = (id) => (apiEnabled ? apiOrThrow(`/messages/${id}`) : demoOpen(id))
export const createConversation = (details) =>
  apiEnabled ? apiOrThrow('/messages', { method: 'POST', body: details }).then((d) => d.conversation) : demoCreate(details)
export const sendMessage = (id, body) =>
  apiEnabled ? apiOrThrow(`/messages/${id}/messages`, { method: 'POST', body: { body } }).then((d) => d.message) : demoSend(id, body)
// Testing tool: adds a reply from the other side (the real API also needs DEMO_TOOLS=true).
export const simulateReply = (id) =>
  apiEnabled ? apiOrThrow(`/messages/${id}/demo-reply`, { method: 'POST', body: {} }).then((d) => d.message) : demoReplyFrom(id)
