import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { listMyListings, setListingPaused, deleteListing } from '../../services/ownerService'
import { picture } from '../../services/catalog'
import { statusInfo } from '../../data/listingStatus'
import { formatPrice } from '../../utils/format'
import './Owner.css'

export default function OwnerListings() {
  const [listings, setListings] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(0)
  const { state } = useLocation()

  useEffect(() => {
    let ignore = false
    listMyListings()
      .then((l) => { if (!ignore) setListings(l) })
      .catch((err) => { if (!ignore) setError(err.message) })
    return () => { ignore = true }
  }, [])

  async function togglePause(l) {
    setBusy(l.id)
    try {
      const updated = await setListingPaused(l.id, l.reviewStatus === 'approved')
      setListings((all) => all.map((x) => (x.id === l.id ? updated : x)))
    } catch (err) {
      setError(err.message)
    }
    setBusy(0)
  }

  async function remove(l) {
    if (!window.confirm(`Delete "${l.listing.title}"? This also deletes its photos and cannot be undone.`)) return
    setBusy(l.id)
    try {
      await deleteListing(l.id)
      setListings((all) => all.filter((x) => x.id !== l.id))
    } catch (err) {
      setError(err.message)
    }
    setBusy(0)
  }

  if (error && !listings) return <p className="op__error" role="alert">{error}</p>
  if (!listings) return <p>Loading…</p>

  return (
    <div className="op">
      <header className="op__head">
        <div>
          <h1>My listings</h1>
          <p>Homes you have posted. New and edited listings are checked before they go live.</p>
        </div>
        <Button to="/owner/new"><Icon name="plus" size={15} /> Post a property</Button>
      </header>

      {state?.notice && <p className="op__notice" role="status"><Icon name="check" size={15} /> {state.notice}</p>}
      {error && <p className="op__error" role="alert">{error}</p>}

      {listings.length === 0 ? (
        <div className="properties__empty">
          <h2>No listings yet</h2>
          <p>Post your first home with photos and details. We will review it, then it goes live.</p>
          <Button to="/owner/new">Post a property</Button>
        </div>
      ) : (
        <ul className="op__list">
          {listings.map((l) => {
            const info = statusInfo[l.reviewStatus]
            const h = l.listing
            return (
              <li key={l.id} className="op__item">
                <img src={picture(h.image)} alt="" loading="lazy" />
                <div className="op__body">
                  <div className="op__top">
                    <h2>{h.title}</h2>
                    <span className={`op__badge op__badge--${info.tone}`}>{info.label}</span>
                  </div>
                  <p className="op__meta">{h.area}, {h.city} · {formatPrice(h.price)}{h.listingType === 'rent' ? ' / month' : ''} · {h.beds} bed · {h.baths} bath</p>
                  <p className="op__text">{info.text}</p>
                  {l.reviewStatus === 'rejected' && l.reviewNote && <p className="op__reason"><b>Reason:</b> {l.reviewNote}</p>}
                  <div className="op__actions">
                    <Link to={`/owner/${l.id}/edit`}>Edit</Link>
                    {l.reviewStatus === 'approved' && <Link to={`/properties/${l.id}`}>View live</Link>}
                    {(l.reviewStatus === 'approved' || l.reviewStatus === 'paused') && (
                      <button type="button" onClick={() => togglePause(l)} disabled={busy === l.id}>{l.reviewStatus === 'approved' ? 'Pause' : 'Resume'}</button>
                    )}
                    <button type="button" className="op__danger" onClick={() => remove(l)} disabled={busy === l.id}>Delete</button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
