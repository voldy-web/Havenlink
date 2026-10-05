import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { approveListing, getForReview, rejectListing } from '../../services/adminService'
import { picture } from '../../services/catalog'
import { availability, comforts, propertyTypes } from '../../data/propertyOptions'
import { statusInfo } from '../../data/listingStatus'
import { formatPrice } from '../../utils/format'
import '../Owner/Owner.css'

export default function AdminReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let ignore = false
    getForReview(id)
      .then((l) => { if (!ignore) setData(l) })
      .catch((err) => { if (!ignore) setError(err.message) })
    return () => { ignore = true }
  }, [id])

  async function decide(action) {
    setBusy(true)
    setError('')
    try {
      if (action === 'approve') await approveListing(id)
      else await rejectListing(id, note)
      navigate('/admin', { state: { notice: action === 'approve' ? 'Listing approved. It is now live.' : 'Listing sent back to the owner with your note.' } })
    } catch (err) {
      setError(err.fields?.note || err.message)
      setBusy(false)
    }
  }

  if (error && !data) return <p className="op__error" role="alert">{error} <Link to="/admin">Back to the queue</Link></p>
  if (!data) return <p>Loading…</p>

  const h = data.listing
  const info = statusInfo[data.reviewStatus]
  const features = comforts.filter((c) => h.features.includes(c.id)).map((c) => c.label)
  const facts = [
    ['For', h.listingType === 'rent' ? 'Rent (per month)' : 'Sale'], ['Type', propertyTypes.find((t) => t.id === h.propertyType)?.label ?? h.propertyType], ['Price', formatPrice(h.price)],
    ['Bedrooms', h.beds], ['Bathrooms', h.baths], ['Size', `${h.sqm} sq m`], ['Address', `${h.address}, ${h.area}, ${h.city}`], ['Available', availability.find((a) => a.id === h.available)?.label ?? h.available],
  ]

  return (
    <div className="op">
      <header className="op__head">
        <div>
          <h1>{h.title}</h1>
          <p>By {data.owner.name || 'a deleted account'} ({data.owner.email}) · <span className={`op__badge op__badge--${info.tone}`}>{info.label}</span></p>
        </div>
        <Link to="/admin" className="op__back">Back to the queue</Link>
      </header>

      <section className="of__panel">
        <h2>Photos ({h.gallery.length})</h2>
        <ul className="of__photos">
          {h.gallery.map((k, i) => <li key={k}><img src={picture(k)} alt={`Photo ${i + 1}`} />{i === 0 && <span className="of__cover">Cover</span>}</li>)}
        </ul>
      </section>

      <section className="of__panel">
        <h2>Details</h2>
        <dl className="ar__facts">
          {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <p className="ar__features">{features.length ? features.join(' · ') : 'No comforts listed'}</p>
        <h3>Description</h3>
        <p className="ar__description">{h.description}</p>
      </section>

      {data.reviewNote && <p className="op__reason"><b>Note to the owner:</b> {data.reviewNote}</p>}
      {error && <p className="op__error" role="alert">{error}</p>}

      {data.reviewStatus === 'pending' ? (
        <section className="of__panel">
          <h2>Decision</h2>
          {rejecting ? (
            <>
              <label className="of__field"><span>Tell the owner what to fix</span>
                <textarea rows={4} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: The photos are too dark. Please add clearer photos of the living room." />
              </label>
              <div className="of__submit">
                <button type="button" className="op__primary op__primary--danger" disabled={busy || note.trim().length < 3} onClick={() => decide('reject')}>Send back to owner</button>
                <button type="button" className="op__back" onClick={() => setRejecting(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <div className="of__submit">
              <button type="button" className="op__primary" disabled={busy} onClick={() => decide('approve')}>Approve and publish</button>
              <button type="button" className="op__primary op__primary--outline" disabled={busy} onClick={() => setRejecting(true)}>Send back…</button>
            </div>
          )}
        </section>
      ) : (
        <p className="op__text">This listing is not waiting for review. {data.reviewStatus === 'approved' && <Link to={`/properties/${data.id}`}>View it live</Link>}</p>
      )}
    </div>
  )
}
