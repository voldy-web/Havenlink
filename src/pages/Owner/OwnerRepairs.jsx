import { useEffect, useState } from 'react'
import { listOwnerRepairs, setRepairStatus } from '../../services/tenancyService'
import { announceOwnerSummaryChanged } from '../../services/ownerService'
import { reportStages, reportCategories, urgencies } from '../../data/reportOptions'
import Icon from '../../components/ui/Icon'
import '../Tenancy/Tenancy.css'
import './Owner.css'

const when = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function Repair({ r, onChange }) {
  const stages = reportStages.map((s) => s.id)
  const later = stages.slice(stages.indexOf(r.status) + 1)
  const [next, setNext] = useState(later[0] || '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const urgency = urgencies.find((u) => u.id === r.urgency)?.label

  async function save() {
    setBusy(true)
    setError('')
    try {
      onChange(await setRepairStatus(r.reference, next, note))
      announceOwnerSummaryChanged()
    } catch (err) { setError(err.fields?.note || err.message) }
    setBusy(false)
  }

  return (
    <article className="tn__card">
      <header>
        <div>
          <h2>{r.summary}</h2>
          <p className="tn__muted">{r.propertyTitle} · from {r.resident.name} · {urgency} · {reportCategories.find((c) => c.id === r.category)?.label} · {r.reference}</p>
        </div>
        <span className={`op__badge op__badge--${r.status === 'Resolved' ? 'ok' : 'wait'}`}>{r.status}</span>
      </header>
      <p className="tn__help">{r.description}</p>
      {r.photos.length > 0 && <div className="rcard__photos">{r.photos.map((p, i) => <img key={i} src={p} alt={`Photo ${i + 1} of the problem`} style={{ width: 96, height: 76, objectFit: 'cover', borderRadius: 8 }} />)}</div>}
      <ul className="tn__money">
        {r.history.map((h, i) => <li key={i}><span>{h.status}{h.note && <> — {h.note}</>}</span><b>{when(h.at)}</b></li>)}
      </ul>
      {later.length > 0 && (
        <div className="tn__form">
          <label>Move it to
            <select value={next} onChange={(e) => setNext(e.target.value)}>{later.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <label className="tn__wide">Note for the resident (optional)
            <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="For example: A plumber will come on Friday morning." />
          </label>
          <div className="tn__wide tn__actions"><button type="button" className="op__primary" disabled={busy} onClick={save}>Update report</button></div>
        </div>
      )}
      {error && <p className="op__error" role="alert">{error}</p>}
    </article>
  )
}

export default function OwnerRepairs() {
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    listOwnerRepairs()
      .then((r) => { if (!ignore) setReports(r) })
      .catch((err) => { if (!ignore) setError(err.message) })
    return () => { ignore = true }
  }, [])

  if (error) return <p className="op__error" role="alert">{error}</p>
  if (!reports) return <p>Loading…</p>
  const open = reports.filter((r) => r.status !== 'Resolved')
  const done = reports.filter((r) => r.status === 'Resolved')
  const replace = (u) => setReports((all) => all.map((x) => (x.reference === u.reference ? u : x)))

  return (
    <div className="tn">
      <header className="tn__head">
        <h1>Repairs</h1>
        <p>Problems reported by people living in your homes. The resident sees every update you make.</p>
      </header>
      {reports.length === 0 && (
        <div className="properties__empty">
          <h2><Icon name="shield" size={20} /> No repair reports</h2>
          <p>Reports from residents with an active tenancy in one of your homes appear here.</p>
        </div>
      )}
      {open.map((r) => <Repair key={`${r.reference}-${r.status}`} r={r} onChange={replace} />)}
      {done.length > 0 && <h2 className="tn__sub">Resolved</h2>}
      {done.map((r) => <Repair key={r.reference} r={r} onChange={replace} />)}
    </div>
  )
}
