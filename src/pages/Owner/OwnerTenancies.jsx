import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import RoomChecklist, { RoomList } from '../../components/tenancy/RoomChecklist'
import { listOwnerViewings } from '../../services/ownerService'
import { listOwnerTenancies, offerTenancy, ownerTenancyAction } from '../../services/tenancyService'
import { formatPrice } from '../../utils/format'
import { fromISO, longDate, startOfToday, toISO } from '../../utils/dates'
import '../Tenancy/Tenancy.css'
import './Owner.css'

const tone = { Offered: 'wait', Active: 'ok', 'Notice given': 'wait', Ended: 'off', Declined: 'bad', Withdrawn: 'off' }
const day = (iso) => longDate(fromISO(String(iso).slice(0, 10)))
const LIVE = ['Offered', 'Active', 'Notice given']
const firstError = (err) => Object.values(err.fields || {})[0] || err.message

// The form for offering a home to someone who viewed it.
function OfferForm({ viewing, onDone, onCancel }) {
  const [f, setF] = useState({ monthlyRent: '', deposit: '', startDate: '', termMonths: '12' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      onDone(await offerTenancy({
        viewingReference: viewing.reference, monthlyRent: Number(f.monthlyRent), deposit: Number(f.deposit || 0), startDate: f.startDate, termMonths: Number(f.termMonths),
      }))
    } catch (err) { setError(firstError(err)) }
    setBusy(false)
  }

  return (
    <form className="tn__form" onSubmit={submit}>
      <label>Monthly rent (GH₵)<input type="number" min="1" step="any" required value={f.monthlyRent} onChange={set('monthlyRent')} /></label>
      <label>Deposit (GH₵, 0 if none)<input type="number" min="0" step="any" required value={f.deposit} onChange={set('deposit')} /></label>
      <label>Start date<input type="date" required min={toISO(startOfToday())} value={f.startDate} onChange={set('startDate')} /></label>
      <label>Length (months)<input type="number" min="1" max="60" required value={f.termMonths} onChange={set('termMonths')} /></label>
      <div className="tn__wide tn__actions">
        <button type="submit" className="op__primary" disabled={busy}>Send offer to {viewing.client.name}</button>
        <button type="button" className="tn__link" onClick={onCancel}>Cancel</button>
      </div>
      {error && <p className="op__error tn__wide" role="alert">{error}</p>}
    </form>
  )
}

// Recording the move-out inspection and the deposit settlement.
function SettleForm({ t, onDone, onCancel }) {
  const [rooms, setRooms] = useState([])
  const [deductions, setDeductions] = useState([])
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const total = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0)
  const refund = Math.round((t.deposit - total) * 100) / 100
  const edit = (i, patch) => setDeductions((all) => all.map((d, n) => (n === i ? { ...d, ...patch } : d)))

  async function submit() {
    setBusy(true)
    setError('')
    try {
      onDone(await ownerTenancyAction(t.reference, 'settle', {
        items: rooms, deductions: deductions.map((d) => ({ reason: d.reason.trim(), amount: Number(d.amount) })), notes,
      }))
    } catch (err) { setError(firstError(err)) }
    setBusy(false)
  }

  return (
    <div className="tn__section">
      <h3>1. Move-out inspection</h3>
      <RoomChecklist value={rooms} onChange={setRooms} />
      <h3 style={{ marginTop: 16 }}>2. What you keep from the deposit</h3>
      {deductions.map((d, i) => (
        <div key={i} className="tn__deduct tn__form" style={{ marginBottom: 8 }}>
          <label>Reason<input value={d.reason} maxLength={120} onChange={(e) => edit(i, { reason: e.target.value })} placeholder="For example: Repair of broken window" /></label>
          <label>Amount (GH₵)<input type="number" min="0" step="any" value={d.amount} onChange={(e) => edit(i, { amount: e.target.value })} /></label>
          <button type="button" className="tn__link" onClick={() => setDeductions((all) => all.filter((_, n) => n !== i))}>Remove</button>
        </div>
      ))}
      {deductions.length < 10 && <button type="button" className="tn__link" onClick={() => setDeductions((all) => [...all, { reason: '', amount: '' }])}>+ Add a deduction</button>}
      <div className="tn__form" style={{ marginTop: 12 }}>
        <label className="tn__wide">Note for the resident (optional)
          <textarea rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
      <ul className="tn__money" style={{ marginTop: 12 }}>
        <li><span>Deposit held</span><b>{formatPrice(t.deposit)}</b></li>
        <li><span>Kept</span><b>− {formatPrice(total)}</b></li>
        <li className="tn__total"><span>To return to the resident</span><b>{formatPrice(Math.max(refund, 0))}</b></li>
      </ul>
      <p className="tn__help">Returning the money is done by you, directly. This records what was agreed, ends the tenancy and puts the home back on the market.</p>
      <div className="tn__actions">
        <button type="button" className="op__primary" disabled={busy || rooms.length === 0 || refund < 0} onClick={submit}>Finish tenancy</button>
        <button type="button" className="tn__link" onClick={onCancel}>Cancel</button>
      </div>
      {error && <p className="op__error" role="alert">{error}</p>}
    </div>
  )
}

function Card({ t, onChange }) {
  const [settling, setSettling] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(action) {
    setBusy(true)
    setError('')
    try { onChange(await ownerTenancyAction(t.reference, action, {})) } catch (err) { setError(err.message) }
    setBusy(false)
  }

  return (
    <article className="tn__card">
      <header>
        <div>
          <h2><Link to={`/properties/${t.propertyId}`}>{t.propertyTitle}</Link></h2>
          <p className="tn__muted">{t.reference}</p>
        </div>
        <span className={`op__badge op__badge--${tone[t.status]}`}>{t.status}</span>
      </header>
      <dl className="tn__facts">
        <div><dt>Resident</dt><dd>{t.resident.name}</dd></div>
        <div><dt>Phone</dt><dd><a href={`tel:${t.resident.phone}`}>{t.resident.phone}</a></dd></div>
        <div><dt>Email</dt><dd><a href={`mailto:${t.resident.email}`}>{t.resident.email}</a></dd></div>
        <div><dt>Rent / deposit</dt><dd>{formatPrice(t.monthlyRent)} / {formatPrice(t.deposit)}</dd></div>
        <div><dt>Term</dt><dd>{day(t.startDate)} → {day(t.endDate)}</dd></div>
        {t.moveOutDate && <div><dt>Moving out</dt><dd>{day(t.moveOutDate)}</dd></div>}
      </dl>

      {t.status === 'Offered' && (
        <div className="tn__actions">
          <span className="tn__help">Waiting for {t.resident.name} to accept. The home shows as Reserved.</span>
          <button type="button" className="tn__link" disabled={busy} onClick={() => run('withdraw')}>Withdraw offer</button>
        </div>
      )}

      {(t.status === 'Active' || t.status === 'Notice given') && !settling && (
        <section className="tn__section">
          <h3>Move-in condition report</h3>
          {!t.moveIn.submittedAt && <p className="tn__help">The resident has not sent their report yet.</p>}
          {t.moveIn.submittedAt && (
            <>
              <RoomList items={t.moveIn.items} />
              {t.moveIn.acknowledgedAt
                ? <p className="tn__help"><Icon name="check" size={14} /> You acknowledged this on {day(t.moveIn.acknowledgedAt)}.</p>
                : <div className="tn__actions"><button type="button" className="op__primary" disabled={busy} onClick={() => run('move-in/acknowledge')}>Acknowledge report</button></div>}
            </>
          )}
        </section>
      )}

      {t.status === 'Notice given' && !settling && (
        <section className="tn__section">
          <h3>The resident is leaving on {day(t.moveOutDate)}</h3>
          <button type="button" className="op__primary" onClick={() => setSettling(true)}>Record move-out and settle deposit</button>
        </section>
      )}
      {settling && <SettleForm t={t} onDone={(u) => { setSettling(false); onChange(u) }} onCancel={() => setSettling(false)} />}

      {t.status === 'Ended' && t.settlement && (
        <section className="tn__section">
          <h3>Settled</h3>
          <ul className="tn__money">
            <li><span>Deposit</span><b>{formatPrice(t.deposit)}</b></li>
            {t.settlement.deductions.map((d, i) => <li key={i}><span>Kept: {d.reason}</span><b>− {formatPrice(d.amount)}</b></li>)}
            <li className="tn__total"><span>Returned to resident</span><b>{formatPrice(t.settlement.refund)}</b></li>
          </ul>
        </section>
      )}
      {error && <p className="op__error" role="alert">{error}</p>}
    </article>
  )
}

export default function OwnerTenancies() {
  const [params, setParams] = useSearchParams()
  const [tenancies, setTenancies] = useState(null)
  const [viewings, setViewings] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const offering = params.get('offer')

  useEffect(() => {
    let ignore = false
    Promise.all([listOwnerTenancies(), listOwnerViewings()])
      .then(([t, v]) => { if (!ignore) { setTenancies(t); setViewings(v) } })
      .catch((err) => { if (!ignore) setError(err.message) })
    return () => { ignore = true }
  }, [])

  if (error) return <p className="op__error" role="alert">{error}</p>
  if (!tenancies) return <p>Loading…</p>

  const taken = new Set(tenancies.filter((t) => LIVE.includes(t.status)).map((t) => t.propertyId))
  const ready = viewings.filter((v) => ['Confirmed', 'Rescheduled'].includes(v.status) && v.listingType === 'rent' && !taken.has(v.propertyId))
  const replace = (u) => setTenancies((all) => all.map((x) => (x.reference === u.reference ? u : x)))
  const created = (t) => {
    setTenancies((all) => [t, ...all])
    setParams({})
    setNotice(`Offer sent to ${t.resident.name}. They can accept or decline it from their My Tenancy page.`)
  }
  const live = tenancies.filter((t) => LIVE.includes(t.status))
  const past = tenancies.filter((t) => !LIVE.includes(t.status))

  return (
    <div className="tn">
      <header className="tn__head">
        <h1>Tenancies</h1>
        <p>Offer a home to someone who viewed it, then follow the tenancy to the end.</p>
      </header>
      {notice && <p className="op__notice" role="status"><Icon name="check" size={15} /> {notice}</p>}

      <section>
        <h2 className="tn__sub">Ready to offer</h2>
        {ready.length === 0 ? (
          <p className="tn__muted">When you confirm a viewing of a home for rent, the visitor appears here so you can offer them the home.</p>
        ) : (
          <ul className="op__list">
            {ready.map((v) => (
              <li key={v.reference} className="op__item ov">
                <div className="op__body">
                  <div className="op__top">
                    <h2>{v.propertyTitle}</h2>
                    {offering !== v.reference && <button type="button" className="op__primary" onClick={() => setParams({ offer: v.reference })}>Make an offer</button>}
                  </div>
                  <p className="op__meta">{v.client.name} · viewing on {longDate(fromISO(v.date))} at {v.time}</p>
                  {offering === v.reference && <OfferForm viewing={v} onDone={created} onCancel={() => setParams({})} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {live.length > 0 && <h2 className="tn__sub">Current</h2>}
      {live.map((t) => <Card key={`${t.reference}-${t.status}-${t.moveIn.acknowledgedAt}`} t={t} onChange={replace} />)}
      {past.length > 0 && <h2 className="tn__sub">Past</h2>}
      {past.map((t) => <Card key={t.reference} t={t} onChange={replace} />)}
    </div>
  )
}
