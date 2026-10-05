import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import RoomChecklist, { RoomList } from '../../components/tenancy/RoomChecklist'
import { listMyTenancies, tenancyAction } from '../../services/tenancyService'
import { formatPrice } from '../../utils/format'
import { fromISO, longDate, startOfToday, toISO } from '../../utils/dates'
import './Tenancy.css'

const tone = { Offered: 'wait', Active: 'ok', 'Notice given': 'wait', Ended: 'off', Declined: 'bad', Withdrawn: 'off' }
const day = (iso) => longDate(fromISO(String(iso).slice(0, 10)))
const LIVE = ['Offered', 'Active', 'Notice given']

// One tenancy, with whatever the resident can do at its current stage.
function Card({ t, onChange }) {
  const [rooms, setRooms] = useState(t.moveIn.items)
  const [moveOut, setMoveOut] = useState('')
  const [panel, setPanel] = useState(null) // 'notice'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const locked = Boolean(t.moveIn.acknowledgedAt)

  async function run(action, body, after) {
    setBusy(true)
    setError('')
    try {
      onChange(await tenancyAction(t.reference, action, body))
      after?.()
    } catch (err) {
      setError(err.fields?.items || err.fields?.moveOutDate || err.message)
    }
    setBusy(false)
  }

  return (
    <article className="tn__card">
      <header>
        <div>
          <h2><Link to={`/properties/${t.propertyId}`}>{t.propertyTitle}</Link></h2>
          <p className="tn__muted">Owner: {t.owner.name} · {t.reference}</p>
        </div>
        <span className={`op__badge op__badge--${tone[t.status]}`}>{t.status}</span>
      </header>

      <dl className="tn__facts">
        <div><dt>Monthly rent</dt><dd>{formatPrice(t.monthlyRent)}</dd></div>
        <div><dt>Deposit</dt><dd>{formatPrice(t.deposit)}</dd></div>
        <div><dt>Starts</dt><dd>{day(t.startDate)}</dd></div>
        <div><dt>Length</dt><dd>{t.termMonths} {t.termMonths === 1 ? 'month' : 'months'} (to {day(t.endDate)})</dd></div>
        {t.moveOutDate && <div><dt>You move out</dt><dd>{day(t.moveOutDate)}</dd></div>}
      </dl>

      {t.status === 'Offered' && (
        <>
          <p className="tn__help">The owner has offered you this home. Accepting means you agree to the rent, deposit and dates above. Rent and deposit are paid to the owner directly for now.</p>
          <div className="tn__actions">
            <button type="button" className="op__primary" disabled={busy} onClick={() => run('accept')}>Accept offer</button>
            <button type="button" className="op__primary op__primary--outline" disabled={busy} onClick={() => run('decline')}>Decline</button>
          </div>
        </>
      )}

      {(t.status === 'Active' || t.status === 'Notice given') && (
        <section className="tn__section">
          <h3>Move-in condition report</h3>
          {locked ? (
            <>
              <p className="tn__help"><Icon name="check" size={14} /> The owner acknowledged your report on {day(t.moveIn.acknowledgedAt)}. It is now your record of how the home was when you arrived.</p>
              <RoomList items={t.moveIn.items} />
            </>
          ) : (
            <>
              <p className="tn__help">Tick each room and say what condition it was in when you moved in. This protects your deposit later. You can change it until the owner acknowledges it.{t.moveIn.submittedAt && ' The owner has been sent your report.'}</p>
              {t.status === 'Active' && <RoomChecklist value={rooms} onChange={(v) => { setRooms(v); setSaved(false) }} />}
              {t.status === 'Active' && (
                <div className="tn__actions">
                  <button type="button" className="op__primary" disabled={busy || rooms.length === 0} onClick={() => run('move-in', { items: rooms }, () => setSaved(true))}>
                    {t.moveIn.submittedAt ? 'Send updated report' : 'Send report to owner'}
                  </button>
                  {saved && <span className="tn__ok" role="status"><Icon name="check" size={14} /> Sent</span>}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {t.status === 'Active' && (
        <section className="tn__section">
          <h3>Moving out?</h3>
          {panel === 'notice' ? (
            <div className="tn__panel">
              <label>Your move-out date
                <input type="date" min={toISO(new Date(startOfToday().getTime() + 864e5))} value={moveOut} onChange={(e) => setMoveOut(e.target.value)} />
              </label>
              <div className="tn__actions">
                <button type="button" className="op__primary op__primary--danger" disabled={busy || !moveOut} onClick={() => run('notice', { moveOutDate: moveOut }, () => setPanel(null))}>Give notice</button>
                <button type="button" className="tn__link" onClick={() => setPanel(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button type="button" className="tn__link" onClick={() => setPanel('notice')}>Give notice to the owner</button>
          )}
        </section>
      )}

      {t.status === 'Notice given' && <p className="tn__help">You have given notice. After you leave, the owner inspects the home and settles your deposit here.</p>}

      {t.status === 'Ended' && t.settlement && (
        <section className="tn__section">
          <h3>Deposit settlement</h3>
          <ul className="tn__money">
            <li><span>Deposit paid</span><b>{formatPrice(t.deposit)}</b></li>
            {t.settlement.deductions.map((d, i) => <li key={i}><span>Kept: {d.reason}</span><b>− {formatPrice(d.amount)}</b></li>)}
            <li className="tn__total"><span>Returned to you</span><b>{formatPrice(t.settlement.refund)}</b></li>
          </ul>
          {t.settlement.notes && <p className="tn__help"><b>Owner’s note:</b> {t.settlement.notes}</p>}
          <h3>Move-out inspection</h3>
          <RoomList items={t.moveOut.items} />
        </section>
      )}

      {error && <p className="op__error" role="alert">{error}</p>}
    </article>
  )
}

export default function MyTenancy() {
  const [list, setList] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    listMyTenancies()
      .then((t) => { if (!ignore) setList(t) })
      .catch((err) => { if (!ignore) setError(err.message) })
    return () => { ignore = true }
  }, [])

  if (error) return <p className="op__error" role="alert">{error}</p>
  if (!list) return <p>Loading…</p>
  const replace = (updated) => setList((all) => all.map((x) => (x.reference === updated.reference ? updated : x)))
  const live = list.filter((t) => LIVE.includes(t.status))
  const past = list.filter((t) => !LIVE.includes(t.status))

  return (
    <div className="tn">
      <header className="tn__head">
        <h1>My Tenancy</h1>
        <p>Offers from owners, your move-in report, notice, and your deposit settlement.</p>
      </header>

      {list.length === 0 && (
        <div className="properties__empty">
          <h2>No tenancy yet</h2>
          <p>After you view a home, the owner can send you an offer. It will appear here for you to accept.</p>
          <Link to="/properties">Browse homes</Link>
        </div>
      )}
      {live.map((t) => <Card key={`${t.reference}-${t.status}`} t={t} onChange={replace} />)}
      {past.length > 0 && <h2 className="tn__sub">Past</h2>}
      {past.map((t) => <Card key={`${t.reference}-${t.status}`} t={t} onChange={replace} />)}
    </div>
  )
}
