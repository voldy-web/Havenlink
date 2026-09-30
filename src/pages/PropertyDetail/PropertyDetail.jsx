import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import PropertyCard from '../../components/cards/PropertyCard'
import PropertyGallery from './PropertyGallery'
import BookingCard from './BookingCard'
import {
  getPropertyById, getSimilarProperties, getAgentById,
} from '../../services/propertyService'
import { buildDetails } from '../../utils/propertyDetails'
import { useSaved } from '../../hooks/useSaved'
import { formatPrice } from '../../utils/format'
import './PropertyDetail.css'

export default function PropertyDetail() {
  const { id } = useParams()

  // `id` in the state records which listing the data belongs to, so we can
  // tell when the page is still loading a newly chosen listing.
  const [data, setData] = useState({ id: null, property: null, agent: null, similar: [] })
  const { isSaved, toggle } = useSaved()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let ignore = false
    async function load() {
      const property = await getPropertyById(id)
      if (!property) return { id, property: null, agent: null, similar: [] }
      const [agent, similar] = await Promise.all([
        getAgentById(property.agentId),
        getSimilarProperties(property),
      ])
      return { id, property, agent, similar }
    }
    load().then((result) => {
      if (!ignore) setData(result)
    })
    return () => { ignore = true }
  }, [id])

  const { property, agent, similar } = data
  const saved = property ? isSaved(property.id) : false
  const details = useMemo(() => (property ? buildDetails(property) : null), [property])

  // Start each listing at the top of the page.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // The visitor cancelled sharing, or the browser blocked it. Nothing to do.
    }
  }

  if (data.id !== id) {
    return <div className="container detail"><p>Loading…</p></div>
  }

  if (!property) {
    return (
      <section className="container detail detail--empty">
        <h1>Property not found</h1>
        <p>This listing may have been removed or the link is incorrect.</p>
        <Button to="/properties">Browse Properties</Button>
      </section>
    )
  }

  const forRent = property.listingType === 'rent'
  const mapBox = `${property.lng - 0.01}%2C${property.lat - 0.006}%2C${property.lng + 0.01}%2C${property.lat + 0.006}`
  const facts = [
    { icon: 'bed', value: property.beds, label: property.beds === 1 ? 'Bedroom' : 'Bedrooms' },
    { icon: 'bath', value: property.baths, label: property.baths === 1 ? 'Bathroom' : 'Bathrooms' },
    { icon: 'area', value: property.sqm, label: 'Sq Metres' },
    { icon: 'home', value: property.propertyType[0].toUpperCase() + property.propertyType.slice(1), label: 'Type' },
    { icon: 'car', value: property.features.includes('parking') ? 'Yes' : 'No', label: 'Parking' },
    { icon: 'key', value: { now: 'Now', month: '30 Days', flexible: 'Flexible' }[property.available], label: 'Move-in' },
  ]

  return (
    <div className="container detail">
      <nav className="detail__crumbs" aria-label="Breadcrumb">
        <Link to="/properties">&larr; Back to results</Link>
      </nav>

      <header className="detail__head">
        <div>
          <div className="detail__tags">
            <span className="detail__status">{property.status === 'Available' ? 'Available Now' : property.status}</span>
            {property.verified && (
              <span className="detail__verified">Haven Verified · #HL-{String(property.id).padStart(4, '0')}</span>
            )}
          </div>
          <h1>{property.title}</h1>
          <p className="detail__address"><Icon name="pin" size={16} /> {property.address}</p>
        </div>

        <div className="detail__price">
          <small>{forRent ? 'MONTHLY RENT' : 'SALE PRICE'}</small>
          <p>
            {formatPrice(property.price)}
            {forRent && <span> / month</span>}
          </p>
          <div className="detail__actions">
            <button aria-label="Share this property" onClick={share}>
              <Icon name="share" size={16} />
            </button>
            <button
              aria-label={saved ? 'Remove from saved' : 'Save property'}
              aria-pressed={saved}
              className={saved ? 'is-saved' : ''}
              onClick={() => toggle(property.id)}
            >
              <Icon name="heart" size={16} />
            </button>
          </div>
          {copied && <span className="detail__copied" role="status">Link copied</span>}
        </div>
      </header>

      <PropertyGallery photos={details.gallery} />

      <div className="detail__layout">
        <div className="detail__main">
          <ul className="detail__facts">
            {facts.map((f) => (
              <li key={f.label}>
                <Icon name={f.icon} size={20} />
                <b>{f.value}</b>
                <small>{f.label}</small>
              </li>
            ))}
          </ul>

          <section className="panel">
            <div className="panel__head">
              <h2>About this {property.propertyType === 'house' ? 'Home' : property.propertyType[0].toUpperCase() + property.propertyType.slice(1)}</h2>
              {property.verified && (
                <span className="panel__badge"><Icon name="check" size={14} /> Haven Verified</span>
              )}
            </div>
            {details.description.map((para) => <p key={para}>{para}</p>)}
            {details.highlights.length > 0 && (
              <ul className="tags">
                {details.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
            )}
          </section>

          {details.groups.length > 0 && (
            <section className="panel">
              <h2>Featured Amenities &amp; Services</h2>
              <div className="amenities">
                {details.groups.map((g) => (
                  <div key={g.title}>
                    <h3>{g.title}</h3>
                    <ul>
                      {g.items.map((item) => (
                        <li key={item}><Icon name="check" size={16} /> {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="panel">
            <h2>{forRent ? 'Lease Terms & Policies' : 'Purchase Details'}</h2>
            <div className="terms">
              {details.terms.map((t) => (
                <div key={t.title}>
                  <h3><Icon name={t.icon} size={15} /> {t.title}</h3>
                  <b>{t.value}</b>
                  <p>{t.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2>Location &amp; Neighbourhood</h2>
              <a
                className="panel__link"
                href={`https://www.openstreetmap.org/?mlat=${property.lat}&mlon=${property.lng}#map=16/${property.lat}/${property.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Maps <Icon name="external" size={13} />
              </a>
            </div>
            <p className="panel__sub">{property.area}, {property.city}</p>
            <iframe
              className="map"
              title={`Map showing ${property.title}`}
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBox}&layer=mapnik&marker=${property.lat}%2C${property.lng}`}
            />
            {details.nearby.length > 0 && (
              <ul className="nearby">
                {details.nearby.map((n) => (
                  <li key={n.name}>
                    <Icon name={n.icon} size={16} />
                    <b>{n.name}</b>
                    <small>{n.distance}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="detail__side">
          <BookingCard property={property} />

          {agent && (
            <section className="agent">
              <div className="agent__who">
                <span className="agent__avatar" aria-hidden="true">
                  {agent.name.split(' ').map((w) => w[0]).join('')}
                </span>
                <div>
                  <h3>{agent.name}</h3>
                  <p>{agent.role} · {agent.company}</p>
                  <small><Icon name="check" size={13} /> Haven Verified Partner</small>
                </div>
              </div>
              <dl>
                <div><dt>Response</dt><dd>{agent.onTime}</dd></div>
                <div><dt>Reviews</dt><dd><Icon name="star" size={12} /> {agent.rating} ({agent.reviews})</dd></div>
              </dl>
              <div className="agent__buttons">
                <Link to="/messages"><Icon name="chat" size={16} /> Chat with {agent.name.split(' ')[0]}</Link>
                <a href={`tel:${agent.phone}`}><Icon name="phone" size={16} /> Direct Call</a>
              </div>
            </section>
          )}

          <section className="trust">
            <h3><Icon name="shield" size={16} /> Haven Verified Listing</h3>
            <p>
              Our team checks every listing and owner before it is published.
              After you move in, you can report any problem from your
              dashboard and follow it until it is fixed.
            </p>
          </section>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="similar">
          <div className="panel__head">
            <div>
              <h2>Similar Available Homes</h2>
              <p className="panel__sub">Compare more verified homes {forRent ? 'for rent' : 'for sale'}.</p>
            </div>
            <Link className="panel__link" to={`/properties?type=${property.listingType}`}>
              Explore all {forRent ? 'rentals' : 'homes for sale'}
            </Link>
          </div>
          <div className="similar__grid">
            {similar.map((p) => <PropertyCard key={p.id} property={p} compact />)}
          </div>
        </section>
      )}
    </div>
  )
}
