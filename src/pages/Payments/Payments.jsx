import { useEffect, useState } from 'react'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { getMyTransactions, summarise, toCsv } from '../../services/paymentService'
import { formatPrice } from '../../utils/format'
import './Payments.css'

const filters = [
  { id: 'all', label: 'All' },
  { id: 'shop', label: 'Shop orders' },
  { id: 'provider', label: 'Provider unlocks' },
]

const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Payments() {
  const [transactions, setTransactions] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let ignore = false
    getMyTransactions()
      .then((t) => { if (!ignore) setTransactions(t) })
      .catch((err) => { if (!ignore) setError(err.message) })
    return () => { ignore = true }
  }, [])

  if (error) return <p className="py__error" role="alert">{error}</p>
  if (!transactions) return <p>Loading…</p>

  const totals = summarise(transactions)
  const shown = transactions.filter((t) => filter === 'all' || t.kind === filter)

  function download() {
    const url = URL.createObjectURL(new Blob([toCsv(shown)], { type: 'text/csv;charset=utf-8' }))
    const link = Object.assign(document.createElement('a'), { href: url, download: 'havenlink-payments.csv' })
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="py">
      <header className="py__head">
        <div>
          <h1>Billing &amp; Payments</h1>
          <p>Every payment you have made on Haven Link, in one place.</p>
        </div>
        <button type="button" className="py__csv" onClick={download} disabled={shown.length === 0}>Download CSV</button>
      </header>

      <p className="py__test" role="note"><Icon name="shield" size={16} /><span>Payments are in <b>test mode</b>: no real money moves. We never store card or phone payment details, only the method you chose.</span></p>

      <div className="py__cards">
        <div><small>Total paid</small><b>{formatPrice(totals.totalPaid)}</b></div>
        <div><small>Shop orders</small><b>{formatPrice(totals.shopPaid)}</b><span>{totals.shopCount} {totals.shopCount === 1 ? 'order' : 'orders'}</span></div>
        <div><small>Provider unlocks</small><b>{formatPrice(totals.unlockPaid)}</b><span>{totals.unlockCount} {totals.unlockCount === 1 ? 'unlock' : 'unlocks'}</span></div>
        <div><small>Due on delivery</small><b>{formatPrice(totals.dueOnDelivery)}</b><span>Pay when it arrives</span></div>
      </div>

      <div className="py__tabs" role="tablist" aria-label="Filter payments">
        {filters.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'is-active' : ''} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="properties__empty">
          <h2>No payments yet</h2>
          <p>Shop orders and unlocked providers will show up here with a receipt.</p>
          <div className="py__empty-actions"><Button to="/shop">Visit the shop</Button><Button to="/services" variant="outline">Find a provider</Button></div>
        </div>
      ) : (
        <ul className="py__list">
          {shown.map((t) => (
            <li key={t.reference}>
              <details>
                <summary>
                  <span className={`py__icon py__icon--${t.kind}`}><Icon name={t.kind === 'shop' ? 'bag' : 'tool'} size={18} /></span>
                  <span className="py__main"><b>{t.title}</b><small>{t.reference} · {day(t.date)} · {t.method}</small></span>
                  <span className="py__amount"><b>{formatPrice(t.amount)}</b><em className={t.status === 'Paid' ? 'is-paid' : 'is-due'}>{t.status}</em></span>
                </summary>
                <div className="py__receipt">
                  <h3>Receipt {t.reference}</h3>
                  <ul>
                    {t.lines.map((l) => <li key={l.label}><span>{l.label}</span><b>{formatPrice(l.amount)}</b></li>)}
                    {t.kind === 'shop' && <li><span>Delivery</span><b>{t.deliveryFee ? formatPrice(t.deliveryFee) : 'Free'}</b></li>}
                    <li className="py__total"><span>Total</span><b>{formatPrice(t.amount)}</b></li>
                  </ul>
                  {t.note && <p>{t.note}</p>}
                  <p>Paid by: {t.method} · {day(t.date)}</p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
