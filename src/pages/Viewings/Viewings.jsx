import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { getMyViewings, cancelViewing } from '../../services/viewingService'
import { fromISO, longDate, startOfToday } from '../../utils/dates'
import '../MyReports/MyReports.css'

export default function Viewings() {
  const [viewings, setViewings] = useState(null)
  const [tab, setTab] = useState('Upcoming')

  useEffect(() => {
    let ignore = false
    getMyViewings().then((v) => { if (!ignore) setViewings(v) })
    return () => { ignore = true }
  }, [])

  if (!viewings) return <p>Loading…</p>
  const today = startOfToday()
  const isUpcoming = (v) => v.status !== 'Cancelled' && fromISO(v.date) >= today
  const shown = viewings.filter((v) => (tab === 'Upcoming' ? isUpcoming(v) : !isUpcoming(v)))

  return (
    <div className="mr">
      <header className="mr__head">
        <div>
          <h1>My Viewings</h1>
          <p>Your booked home tours. The owner confirms each request or suggests another time.</p>
        </div>
        <Button to="/properties">Find homes</Button>
      </header>

      <div className="mr__tabs" role="tablist">
        {['Upcoming', 'Past & cancelled'].map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
            {t} <span>{viewings.filter((v) => (t === 'Upcoming' ? isUpcoming(v) : !isUpcoming(v))).length}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="properties__empty">
          <h2>{tab === 'Upcoming' ? 'No upcoming viewings' : 'Nothing here yet'}</h2>
          <p>{tab === 'Upcoming' ? 'Book a viewing from any property page.' : 'Past and cancelled viewings appear here.'}</p>
          {tab === 'Upcoming' && <Button to="/properties">Browse homes</Button>}
        </div>
      ) : (
        <div className="mr__list">
          {shown.map((v) => (
            <article key={v.reference} className="rcard">
              <header>
                <span className="rcard__cat">{v.format === 'video' ? 'Live video tour' : 'In-person'}</span>
                <small>{v.reference}</small>
                <b className={`rcard__status ${v.status === 'Cancelled' ? 'is-cancelled' : ''}`}>{v.status}</b>
              </header>
              <h2><Link to={`/properties/${v.propertyId}`}>{v.propertyTitle}</Link></h2>
              <p className="rcard__where"><Icon name="calendar" size={13} /> {longDate(fromISO(v.date))} at {v.time} · {v.attendees} {v.attendees === 1 ? 'person' : 'people'}</p>
              {isUpcoming(v) && (
                <div className="viewings__actions">
                  <Button to={`/properties/${v.propertyId}/book`} size="sm" variant="outline">Book again / change</Button>
                  <button className="rcard__demo" onClick={async () => setViewings(await cancelViewing(v.reference))}>Cancel viewing</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
