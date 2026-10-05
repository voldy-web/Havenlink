import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { listForReview } from '../../services/adminService'
import { picture } from '../../services/catalog'
import { statusInfo } from '../../data/listingStatus'
import { formatPrice } from '../../utils/format'
import '../Owner/Owner.css'

const tabs = [
  { id: 'pending', label: 'To review' },
  { id: 'approved', label: 'Live' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'paused', label: 'Paused' },
  { id: 'all', label: 'All' },
]

const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function AdminQueue() {
  const [status, setStatus] = useState('pending')
  const [result, setResult] = useState({ status: null, listings: [], error: '' })
  const { state } = useLocation()

  useEffect(() => {
    let ignore = false
    listForReview(status)
      .then((listings) => { if (!ignore) setResult({ status, listings, error: '' }) })
      .catch((err) => { if (!ignore) setResult({ status, listings: [], error: err.message }) })
    return () => { ignore = true }
  }, [status])

  const loading = result.status !== status
  return (
    <div className="op">
      <header className="op__head">
        <div>
          <h1>Listing review</h1>
          <p>Homes posted by owners. Check the photos and details, then approve or send back.</p>
        </div>
      </header>

      {state?.notice && <p className="op__notice" role="status"><Icon name="check" size={15} /> {state.notice}</p>}

      <div className="py__tabs" role="tablist" aria-label="Filter listings">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={status === t.id} className={status === t.id ? 'is-active' : ''} onClick={() => setStatus(t.id)}>{t.label}</button>
        ))}
      </div>

      {result.error && <p className="op__error" role="alert">{result.error}</p>}
      {loading ? <p>Loading…</p> : result.listings.length === 0 ? (
        <div className="properties__empty"><h2>Nothing here</h2><p>{status === 'pending' ? 'No listings are waiting for review.' : 'No listings with this status.'}</p></div>
      ) : (
        <ul className="op__list">
          {result.listings.map((l) => {
            const info = statusInfo[l.reviewStatus]
            return (
              <li key={l.id} className="op__item">
                <img src={picture(l.listing.image)} alt="" loading="lazy" />
                <div className="op__body">
                  <div className="op__top">
                    <h2>{l.listing.title}</h2>
                    <span className={`op__badge op__badge--${info.tone}`}>{info.label}</span>
                  </div>
                  <p className="op__meta">{l.listing.area}, {l.listing.city} · {formatPrice(l.listing.price)}{l.listing.listingType === 'rent' ? ' / month' : ''}</p>
                  <p className="op__text">By {l.owner.name || 'a deleted account'} ({l.owner.email}) · updated {day(l.updatedAt)}</p>
                  <div className="op__actions"><Link to={`/admin/${l.id}`}>{l.reviewStatus === 'pending' ? 'Review' : 'Open'}</Link></div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
