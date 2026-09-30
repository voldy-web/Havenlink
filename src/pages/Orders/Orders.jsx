import { useEffect, useState } from 'react'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { getMyOrders, advanceOrder, orderStages } from '../../services/orderService'
import { demoTools } from '../../services/api'
import { longDate, fromISO } from '../../utils/dates'
import { formatPrice } from '../../utils/format'
import '../MyReports/MyReports.css'

const when = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function Orders() {
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    let ignore = false
    getMyOrders().then((o) => { if (!ignore) setOrders(o) })
    return () => { ignore = true }
  }, [])

  if (!orders) return <p>Loading…</p>

  return (
    <div className="mr">
      <header className="mr__head">
        <div>
          <h1>My Orders</h1>
          <p>Track your shop orders from Confirmed to Delivered.</p>
        </div>
        <Button to="/shop">Continue shopping</Button>
      </header>

      {orders.length === 0 ? (
        <div className="properties__empty">
          <h2>No orders yet</h2>
          <p>Beds, couches and appliances you order will be tracked here.</p>
          <Button to="/shop">Visit the shop</Button>
        </div>
      ) : (
        <div className="mr__list">
          {orders.map((o) => {
            const at = Math.max(0, orderStages.findIndex((s) => s.id === o.status))
            return (
              <article key={o.reference} className="rcard">
                <header>
                  <span className="rcard__cat">{o.items.length} {o.items.length === 1 ? 'item' : 'items'}</span>
                  <small>{o.reference}</small>
                  <b className={`rcard__status ${o.status === 'Delivered' ? 'is-done' : ''}`}>{o.status}</b>
                </header>
                <h2>{formatPrice(o.total)} <small style={{ fontSize: 13, fontWeight: 500 }}>{o.paid ? `paid with ${o.paymentMethod}` : 'pay on delivery'}</small></h2>
                <ul className="orders__items">
                  {o.items.map((i) => (
                    <li key={i.productId + JSON.stringify(i.choices)}>
                      <span>{i.qty} x {i.name}{Object.values(i.choices || {}).length > 0 && <small> ({Object.values(i.choices).join(', ')})</small>}</span>
                      <b>{formatPrice(i.qty * i.unitPrice)}</b>
                    </li>
                  ))}
                </ul>
                <p className="rcard__where"><Icon name="pin" size={13} /> {o.address.street}, {o.address.area}, {o.address.city} · {longDate(fromISO(o.deliveryDate))}, {o.deliveryWindow}</p>

                <ol className="rcard__steps">
                  {orderStages.map((s, i) => {
                    const entry = (o.history || []).find((h) => h.status === s.id)
                    return (
                      <li key={s.id} className={i < at || (i === at && s.id === 'Delivered') ? 'is-done' : i === at ? 'is-current' : ''}>
                        <span>{i <= at ? <Icon name="check" size={13} /> : i + 1}</span>
                        <div><b>{s.id}</b><small>{entry ? when(entry.at) : 'Pending'}</small></div>
                      </li>
                    )
                  })}
                </ol>
                <p className="rcard__now">{orderStages[at].text}</p>

                {demoTools && o.status !== 'Delivered' && (
                  <button className="rcard__demo" onClick={async () => setOrders(await advanceOrder(o.reference))}>
                    Demo: move to next stage
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
