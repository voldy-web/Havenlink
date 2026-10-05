import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { listOwnerViewings, respondToViewing, announceOwnerSummaryChanged } from '../../services/ownerService'
import { fromISO, longDate, startOfToday, toISO } from '../../utils/dates'
import './Owner.css'

const slots = ['9:30 AM', '11:00 AM', '1:30 PM', '3:00 PM', '4:30 PM', '6:00 PM']
const tone = { Pending: 'wait', Confirmed: 'ok', Rescheduled: 'wait', Declined: 'bad', Cancelled: 'off' }
const tabs = [
  { id: 'respond', label: 'To respond' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'closed', label: 'Past & closed' },
]

// One viewing request, with the buttons to answer it.
function Request({ v, onChange }) {
  const [panel, setPanel] = useState(null) // 'reschedule' | 'decline'
  const [date, setDate] = useState(v.date)
  const [time, setTime] = useState(slots.includes(v.time) ? v.time : slots[0])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const open = v.status === 'Pending' || v.status === 'Confirmed' || v.status === 'Rescheduled'

  async function send(action, body) {
    setBusy(true)
    setError('')
    try {
      onChange(await respondToViewing(v.reference, action, body))
      announceOwnerSummaryChanged()
      setPanel(null)
    } catch (err) {
      setError(err.fields?.note || err.fields?.date || err.fields?.time || err.message)
    }
    setBusy(false)
  }

  return (
    <li className="op__item ov">
      <div className="op__body">
        <div className="op__top">
          <h2><Link to={`/properties/${v.propertyId}`}>{v.propertyTitle}</Link></h2>
          <span className={`op__badge op__badge--${tone[v.status]}`}>{v.status}</span>
        </div>
        <p className="op__meta"><Icon name="calendar" size={13} /> {longDate(fromISO(v.date))} at {v.time} · {v.format === 'video' ? 'Live video tour' : 'In person'} · {v.attendees} {v.attendees === 1 ? 'person' : 'people'} · {v.reference}</p>
        <dl className="ov__client">
          <div><dt>Visitor</dt><dd>{v.client.name}</dd></div>
          <div><dt>Phone</dt><dd><a href={`tel:${v.client.phone}`}>{v.client.phone}</a></dd></div>
          <div><dt>Email</dt><dd><a href={`mailto:${v.client.email}`}>{v.client.email}</a></dd></div>
          {v.moveIn && <div><dt>Wants to move in</dt><dd>{longDate(fromISO(v.moveIn))}</dd></div>}
          {v.pet !== 'none' && <div><dt>Pet</dt><dd>{v.pet}</dd></div>}
        </dl>
        {v.ownerNote && <p className="op__text"><b>Your note:</b> {v.ownerNote}</p>}

        {open && !panel && (
          <div className="op__actions">
            {v.status === 'Pending' && <button type="button" disabled={busy} onClick={() => send('confirm', {})}>Confirm</button>}
            {v.listingType === 'rent' && (v.status === 'Confirmed' || v.status === 'Rescheduled') && <Link to={`/owner/tenancies?offer=${v.reference}`}>Offer this home</Link>}
            <button type="button" onClick={() => setPanel('reschedule')}>Suggest another time</button>
            <button type="button" className="op__danger" onClick={() => setPanel('decline')}>Decline</button>
          </div>
        )}

        {panel === 'reschedule' && (
          <div className="ov__panel">
            <label>New date <input type="date" min={toISO(startOfToday())} value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label>New time
              <select value={time} onChange={(e) => setTime(e.target.value)}>{slots.map((t) => <option key={t}>{t}</option>)}</select>
            </label>
            <label className="ov__wide">Note for the visitor (optional)
              <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="For example: I am travelling on that day." />
            </label>
            <div className="op__actions">
              <button type="button" className="op__primary" disabled={busy} onClick={() => send('reschedule', { date, time, note })}>Send new time</button>
              <button type="button" onClick={() => setPanel(null)}>Cancel</button>
            </div>
          </div>
        )}

        {panel === 'decline' && (
          <div className="ov__panel">
            <label className="ov__wide">Tell the visitor why
              <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="For example: The home is no longer available." />
            </label>
            <div className="op__actions">
              <button type="button" className="op__primary op__primary--danger" disabled={busy || note.trim().length < 3} onClick={() => send('decline', { note })}>Decline viewing</button>
              <button type="button" onClick={() => setPanel(null)}>Cancel</button>
            </div>
          </div>
        )}
        {error && <p className="op__error" role="alert">{error}</p>}
      </div>
    </li>
  )
}

export default function OwnerViewings() {
  const [viewings, setViewings] = useState(null)
  const [tab, setTab] = useState('respond')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let ignore = false
    listOwnerViewings()
      .then((v) => { if (!ignore) setViewings(v) })
      .catch((err) => { if (!ignore) setError(err.message) })
    return () => { ignore = true }
  }, [])

  if (error && !viewings) return <p className="op__error" role="alert">{error}</p>
  if (!viewings) return <p>Loading…</p>

  const today = startOfToday()
  const group = (v) => {
    if (v.status === 'Pending' && fromISO(v.date) >= today) return 'respond'
    if ((v.status === 'Confirmed' || v.status === 'Rescheduled') && fromISO(v.date) >= today) return 'upcoming'
    return 'closed'
  }
  const shown = viewings.filter((v) => group(v) === tab)
  // After an answer the request moves to another tab, so say where it went.
  const where = { Confirmed: 'Upcoming', Rescheduled: 'Upcoming', Declined: 'Past & closed' }
  const replace = (updated) => {
    setViewings((all) => all.map((x) => (x.reference === updated.reference ? updated : x)))
    setNotice(`${updated.status === 'Rescheduled' ? 'New time sent' : updated.status}. You can find this request under ${where[updated.status]}.`)
  }

  return (
    <div className="op">
      <header className="op__head">
        <div>
          <h1>Viewing requests</h1>
          <p>People who asked to view your homes. Confirm, suggest another time, or decline.</p>
        </div>
      </header>

      {notice && <p className="op__notice" role="status"><Icon name="check" size={15} /> {notice}</p>}

      <div className="py__tabs" role="tablist" aria-label="Filter viewing requests">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-active' : ''} onClick={() => { setTab(t.id); setNotice('') }}>
            {t.label} ({viewings.filter((v) => group(v) === t.id).length})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="properties__empty">
          <h2>{tab === 'respond' ? 'Nothing waiting' : 'Nothing here'}</h2>
          <p>{tab === 'respond' ? 'New viewing requests for your homes show up here.' : 'Viewings you have answered appear here.'}</p>
        </div>
      ) : (
        <ul className="op__list">{shown.map((v) => <Request key={`${v.reference}-${v.status}-${v.date}-${v.time}`} v={v} onChange={replace} />)}</ul>
      )}
    </div>
  )
}
