import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import PropertyCard from '../../components/cards/PropertyCard'
import { useSaved } from '../../hooks/useSaved'
import { useAuth } from '../../hooks/useAuth'
import { getMyReports } from '../../services/reportService'
import { getMyViewings } from '../../services/viewingService'
import { getMyOrders } from '../../services/orderService'
import { getMyServiceRequests } from '../../services/providerService'
import { getPropertyById } from '../../services/propertyService'
import { reportStages, reportCategories } from '../../data/reportOptions'
import { fromISO, startOfToday } from '../../utils/dates'
import { formatPrice } from '../../utils/format'
import './Dashboard.css'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { ids } = useSaved()
  const { user } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    let ignore = false
    Promise.all([getMyReports(), getMyViewings(), getMyOrders(), getMyServiceRequests(), Promise.all(ids.map(getPropertyById))])
      .then(([reports, viewings, orders, requests, saved]) => {
        if (!ignore) setData({ reports, viewings, orders, requests, saved: saved.filter(Boolean) })
      })
    return () => { ignore = true }
  }, [ids])

  if (!data) return <p>Loading…</p>
  const { reports, viewings, orders, requests, saved } = data

  const open = reports.filter((r) => r.status !== 'Resolved')
  const latest = open[0]
  const today = startOfToday()
  const upcoming = viewings.filter((v) => fromISO(v.date) >= today)

  const stats = [
    { icon: 'calendar', label: 'Upcoming viewings', value: upcoming.length, sub: upcoming[0] ? `Next: ${fromISO(upcoming[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${upcoming[0].time}` : 'None booked', to: '/properties' },
    { icon: 'heart', label: 'Saved homes', value: saved.length, sub: saved.length ? 'Tap to review' : 'Save homes you like', to: '/dashboard/saved' },
    { icon: 'shield', label: 'Open reports', value: open.length, sub: latest ? `${latest.status}: ${latest.summary.slice(0, 26)}` : 'Nothing to fix', to: '/reports' },
    { icon: 'truck', label: 'Shop orders', value: orders.length, sub: orders[0] ? `Latest: ${orders[0].reference}` : 'No orders yet', to: '/orders' },
  ]

  return (
    <div className="overview">
      <section className="overview__hero">
        <div>
          <span className="overview__tag"><Icon name="check" size={13} /> Resident</span>
          <h1>{greeting()}, {user.name.split(' ')[0]}!</h1>
          <p>Here is what is happening with your home and your bookings.</p>
        </div>
        <div className="overview__actions">
          <Button to="/reports/new">Report a Home Problem</Button>
          <Button to="/services" variant="secondary">Book a Skilled Worker</Button>
        </div>
      </section>

      <ul className="overview__stats">
        {stats.map((s) => (
          <li key={s.label}>
            <Link to={s.to}>
              <span><Icon name={s.icon} size={18} /></span>
              <small>{s.label}</small>
              <b>{s.value}</b>
              <em>{s.sub}</em>
            </Link>
          </li>
        ))}
      </ul>

      <div className="overview__grid">
        <section className="dcard">
          <div className="dcard__head"><h2>Maintenance</h2><Link to="/reports">View all</Link></div>
          {latest ? (
            <div className="ticket">
              <p className="ticket__ref">{latest.reference} · {latest.urgency === 'urgent' ? 'Urgent' : latest.urgency === 'medium' ? 'Medium' : 'Low'} · {reportCategories.find((c) => c.id === latest.category)?.label}</p>
              <h3>{latest.summary}</h3>
              <ol className="mini-steps">
                {reportStages.map((st, i) => {
                  const at = reportStages.findIndex((x) => x.id === latest.status)
                  return <li key={st.id} className={i < at ? 'is-done' : i === at ? 'is-current' : ''}><span>{i < at ? <Icon name="check" size={12} /> : i + 1}</span>{st.id}</li>
                })}
              </ol>
            </div>
          ) : (
            <div className="dcard__empty">
              <p>No open problems. If something breaks, report it and we will track it until it is fixed.</p>
              <Button to="/reports/new" size="sm">Report a problem</Button>
            </div>
          )}
        </section>

        <section className="dcard">
          <div className="dcard__head"><h2>Upcoming Viewings</h2><Link to="/properties">Find homes</Link></div>
          {upcoming.length ? (
            <ul className="dlist">
              {upcoming.slice(0, 3).map((v) => (
                <li key={v.reference}>
                  <span className="dlist__date"><small>{fromISO(v.date).toLocaleDateString('en-GB', { month: 'short' })}</small><b>{fromISO(v.date).getDate()}</b></span>
                  <div><b>{v.propertyTitle}</b><small>{v.format === 'video' ? 'Live video tour' : 'In-person'} · {v.time} · {v.status}</small></div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dcard__empty"><p>You have no viewings booked.</p><Button to="/properties" size="sm" variant="secondary">Browse homes</Button></div>
          )}
        </section>

        <section className="dcard">
          <div className="dcard__head"><h2>Hired Pros</h2><Link to="/services">Find a pro</Link></div>
          {requests.length ? (
            <ul className="dlist">
              {requests.slice(0, 3).map((r) => (
                <li key={r.reference}>
                  <span className="dlist__icon"><Icon name="tool" size={16} /></span>
                  <div><b>{r.providerName}</b><small>{r.service} · {formatPrice(r.fee)} unlock paid</small></div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dcard__empty"><p>Need a plumber or electrician? Unlock a pro's contact for a small fee.</p><Button to="/services" size="sm" variant="secondary">Browse pros</Button></div>
          )}
        </section>

        <section className="dcard">
          <div className="dcard__head"><h2>Recent Orders</h2><Link to="/shop">Shop</Link></div>
          {orders.length ? (
            <ul className="dlist">
              {orders.slice(0, 3).map((o) => (
                <li key={o.reference}>
                  <span className="dlist__icon"><Icon name="bag" size={16} /></span>
                  <div><b>{o.reference}</b><small>{o.items.length} {o.items.length === 1 ? 'item' : 'items'} · {formatPrice(o.total)} · {o.status}</small></div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dcard__empty"><p>Furnish your home with beds, couches and appliances.</p><Button to="/shop" size="sm" variant="secondary">Visit the shop</Button></div>
          )}
        </section>
      </div>

      {saved.length > 0 && (
        <section className="overview__saved">
          <div className="dcard__head"><h2>Saved Properties</h2><Link to="/dashboard/saved">View all ({saved.length})</Link></div>
          <div className="shop__grid">{saved.slice(0, 2).map((p) => <PropertyCard key={p.id} property={p} compact />)}</div>
        </section>
      )}
    </div>
  )
}
