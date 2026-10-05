import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { demoTools, apiEnabled } from '../../services/api'
import { getAgentById, getPropertyById } from '../../services/propertyService'
import {
  listConversations, openConversation, createConversation, sendMessage, simulateReply, announceMessagesChanged, MAX_LENGTH, SUPPORT_NAME,
} from '../../services/messageService'
import './Messages.css'

const initials = (name) => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
const clock = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const dayLabel = (iso) => {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 864e5)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
const short = (iso) => {
  const d = new Date(iso)
  return d.toDateString() === new Date().toDateString() ? clock(iso) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ---------- Left: the list of conversations ----------
function ConversationList({ conversations, activeId, base, canStart }) {
  const [onlyUnread, setOnlyUnread] = useState(false)
  const shown = conversations.filter((c) => !onlyUnread || c.unread > 0)
  const unreadTotal = conversations.reduce((n, c) => n + c.unread, 0)
  return (
    <aside className="msg__list" aria-label="Conversations">
      <div className="msg__list-head">
        <h2>Messages</h2>
        {canStart && <Link to={`${base}/new`} className="msg__new"><Icon name="plus" size={14} /> New</Link>}
      </div>
      <div className="msg__filter" role="tablist" aria-label="Filter conversations">
        <button type="button" role="tab" aria-selected={!onlyUnread} className={!onlyUnread ? 'is-active' : ''} onClick={() => setOnlyUnread(false)}>All ({conversations.length})</button>
        <button type="button" role="tab" aria-selected={onlyUnread} className={onlyUnread ? 'is-active' : ''} onClick={() => setOnlyUnread(true)}>Unread ({unreadTotal})</button>
      </div>
      {shown.length === 0 ? (
        <p className="msg__none">{conversations.length === 0 ? (canStart ? 'No conversations yet. Message an agent from a home you like, or contact support.' : 'No messages yet. When someone writes to you about one of your homes, it appears here.') : 'Nothing unread.'}</p>
      ) : (
        <ul>
          {shown.map((c) => (
            <li key={c.id}>
              <Link to={`${base}/${c.id}`} className={`msg__item ${c.id === activeId ? 'is-active' : ''} ${c.unread ? 'is-unread' : ''}`}>
                <span className="msg__avatar" aria-hidden="true">{initials(c.counterpartName)}</span>
                <span className="msg__item-main">
                  <span className="msg__item-top"><b>{c.counterpartName}</b><small>{short(c.lastMessageAt)}</small></span>
                  <span className="msg__subject">{c.subject}</span>
                  <span className="msg__preview">{c.lastFromMe ? 'You: ' : ''}{c.lastBody}</span>
                </span>
                {c.unread > 0 && <i className="msg__badge" aria-label={`${c.unread} unread`}>{c.unread}</i>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

// A text box that sends on Enter (Shift+Enter makes a new line).
function Composer({ onSend, disabled }) {
  const [text, setText] = useState('')
  function submit(e) {
    e?.preventDefault()
    const body = text.trim()
    if (!body || disabled) return
    setText('')
    onSend(body)
  }
  return (
    <form className="msg__composer" onSubmit={submit}>
      <label className="sr-only" htmlFor="msg-text">Write a message</label>
      <textarea
        id="msg-text" rows={2} maxLength={MAX_LENGTH} placeholder="Write a message…" value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e) }}
      />
      <button type="submit" disabled={disabled || !text.trim()}>Send</button>
    </form>
  )
}

// ---------- Right: one open conversation ----------
function Chat({ id, onChanged, base }) {
  const [data, setData] = useState(null)
  const [loadedProperty, setLoadedProperty] = useState(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const bottom = useRef(null)

  const load = useCallback(() => openConversation(id)
    .then((d) => { setData(d); setError(''); onChanged(); announceMessagesChanged() })
    .catch((err) => setError(err.message)), [id, onChanged])

  useEffect(() => {
    load()
    // With the real server, check for new messages every 8 seconds while the tab is open.
    if (!apiEnabled) return undefined
    const timer = setInterval(() => { if (!document.hidden) load() }, 8000)
    return () => clearInterval(timer)
  }, [load])

  const propertyId = data?.conversation.propertyId
  useEffect(() => {
    let ignore = false
    if (propertyId) getPropertyById(propertyId).then((p) => { if (!ignore) setLoadedProperty(p) })
    return () => { ignore = true }
  }, [propertyId])
  const property = propertyId && loadedProperty?.id === propertyId ? loadedProperty : null

  const count = data?.messages.length
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }) }, [count])

  async function send(body) {
    setSending(true)
    try {
      await sendMessage(id, body)
      await load()
    } catch (err) {
      setError(err.message)
    }
    setSending(false)
  }

  async function reply() {
    try {
      await simulateReply(id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (error && !data) return <section className="msg__chat"><p className="msg__error" role="alert">{error}</p><Link to={base}>Back to messages</Link></section>
  if (!data) return <section className="msg__chat"><p className="msg__empty">Loading…</p></section>

  const { conversation, messages } = data
  return (
    <section className="msg__chat" aria-label={`Conversation with ${conversation.counterpartName}`}>
      <header className="msg__chat-head">
        <Link to={base} className="msg__back" aria-label="Back to all conversations">‹</Link>
        <span className="msg__avatar" aria-hidden="true">{initials(conversation.counterpartName)}</span>
        <div>
          <h2>{conversation.counterpartName}</h2>
          <p>{conversation.subject}</p>
        </div>
        {property && <Link to={`/properties/${property.id}`} className="msg__prop"><Icon name="home" size={14} /> {property.title}</Link>}
      </header>

      {!demoTools && conversation.kind !== 'owner' && <p className="msg__note" role="note">Your messages are saved to your account. Replies from agents and support are not live yet.</p>}

      <div className="msg__thread" role="log" aria-live="polite">
        {messages.map((m, i) => {
          const label = dayLabel(m.createdAt)
          const showDay = i === 0 || dayLabel(messages[i - 1].createdAt) !== label
          return (
            <div key={m.id} className="msg__row">
              {showDay && <p className="msg__day">{label}</p>}
              <div className={`msg__bubble ${m.fromMe ? 'is-me' : 'is-them'}`}>
                <p>{m.body}</p>
                <small>{clock(m.createdAt)}</small>
              </div>
            </div>
          )
        })}
        <div ref={bottom} />
      </div>

      {error && <p className="msg__error" role="alert">{error}</p>}
      <Composer onSend={send} disabled={sending} />
      {demoTools && conversation.kind !== 'owner' && <button type="button" className="msg__demo" onClick={reply}>Demo: simulate a reply</button>}
    </section>
  )
}

// ---------- Right: start a new conversation ----------
function NewMessage({ onChanged, base }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const propertyId = Number(params.get('property')) || null
  const [target, setTarget] = useState(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  // Who the message goes to: the agent of the home you came from, otherwise Haven Link Support.
  useEffect(() => {
    let ignore = false
    async function pick() {
      const property = propertyId ? await getPropertyById(propertyId) : null
      const agent = property ? await getAgentById(property.agentId) : null
      if (ignore) return
      if (property && !agent && property.ownerName) {
        setTarget({ kind: 'owner', propertyId: property.id, counterpartName: property.ownerName, label: `${property.ownerName}, property owner` })
        setSubject(`Question about ${property.title}`)
      } else if (property && agent) {
        setTarget({ kind: 'agent', counterpartId: agent.id, counterpartName: agent.name, propertyId: property.id, label: `${agent.name}, ${agent.role}` })
        setSubject(`Question about ${property.title}`)
      } else {
        setTarget({ kind: 'support', counterpartName: SUPPORT_NAME, label: SUPPORT_NAME })
      }
    }
    pick()
    return () => { ignore = true }
  }, [propertyId])

  async function submit(e) {
    e.preventDefault()
    const found = {}
    if (subject.trim().length < 3) found.subject = 'Add a short subject.'
    if (!body.trim()) found.body = 'Write your message.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const created = await createConversation({ kind: target.kind, counterpartId: target.counterpartId, counterpartName: target.counterpartName, propertyId: target.propertyId, subject, body })
      onChanged()
      navigate(`${base}/${created.id}`, { replace: true })
    } catch (err) {
      setErrors({ form: err.message, ...err.fields })
      setBusy(false)
    }
  }

  if (!target) return <section className="msg__chat"><p className="msg__empty">Loading…</p></section>
  return (
    <section className="msg__chat msg__chat--new">
      <header className="msg__chat-head">
        <Link to={base} className="msg__back" aria-label="Back to all conversations">‹</Link>
        <div><h2>New message</h2><p>To: {target.label}</p></div>
      </header>
      <form className="msg__form" onSubmit={submit} noValidate>
        <label><span>Subject</span>
          <input value={subject} maxLength={120} onChange={(e) => setSubject(e.target.value)} aria-invalid={Boolean(errors.subject)} />
          {errors.subject && <em>{errors.subject}</em>}</label>
        <label><span>Message</span>
          <textarea rows={6} maxLength={MAX_LENGTH} value={body} onChange={(e) => setBody(e.target.value)} aria-invalid={Boolean(errors.body)} />
          {errors.body && <em>{errors.body}</em>}</label>
        {errors.form && <p className="msg__error" role="alert">{errors.form}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
        <p className="msg__hint">Please do not share passwords or payment details in messages.</p>
      </form>
    </section>
  )
}

// ---------- The whole Messages screen ----------
export default function Messages({ base = '/messages', canStart = true }) {
  const { id } = useParams()
  const [conversations, setConversations] = useState(null)
  const [error, setError] = useState('')

  const refresh = useCallback(() => listConversations()
    .then((list) => { setConversations(list); setError('') })
    .catch((err) => setError(err.message)), [])

  useEffect(() => {
    refresh()
    if (!apiEnabled) return undefined
    const timer = setInterval(() => { if (!document.hidden) refresh() }, 15000)
    return () => clearInterval(timer)
  }, [refresh])

  if (error && !conversations) return <p className="msg__error" role="alert">{error}</p>
  if (!conversations) return <p>Loading…</p>

  const open = Boolean(id)
  return (
    <div className={`msg ${open ? 'is-open' : ''}`}>
      <ConversationList conversations={conversations} activeId={id} base={base} canStart={canStart} />
      {id === 'new' && canStart ? <NewMessage key="new" onChanged={refresh} base={base} />
        : id ? <Chat key={id} id={id} onChanged={refresh} base={base} />
          : <section className="msg__chat msg__chat--blank"><Icon name="chat" size={40} /><h2>Select a conversation</h2><p>{canStart ? 'Or start a new one with an agent or Haven Link Support.' : 'Replies to people who write about your homes appear here.'}</p>{canStart && <Link to={`${base}/new`} className="msg__start">New message</Link>}</section>}
    </div>
  )
}
