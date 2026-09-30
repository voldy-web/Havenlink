import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import UnlockCard from './UnlockCard'
import { getProviderById } from '../../services/providerService'
import { buildProfile } from '../../utils/providerProfile'
import { formatPrice } from '../../utils/format'
import '../PropertyDetail/PropertyDetail.css'
import './ProviderProfile.css'

export default function ProviderProfile() {
  const { id } = useParams()
  const [data, setData] = useState({ id: null, provider: null })

  useEffect(() => {
    let ignore = false
    getProviderById(id).then((provider) => {
      if (!ignore) setData({ id, provider })
    })
    return () => { ignore = true }
  }, [id])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const { provider } = data
  const profile = useMemo(() => (provider ? buildProfile(provider) : null), [provider])

  if (data.id !== id) return <div className="container detail"><p>Loading…</p></div>

  if (!provider) {
    return (
      <section className="container detail detail--empty">
        <h1>Provider not found</h1>
        <p>This provider may have been removed or the link is incorrect.</p>
        <Button to="/services">Browse Service Pros</Button>
      </section>
    )
  }

  const { trade, priceList, highlights, reviews } = profile
  const initials = provider.name.split(' ').map((w) => w[0]).slice(0, 2).join('')

  return (
    <div className="container detail">
      <nav className="detail__crumbs" aria-label="Breadcrumb">
        <Link to="/services">&larr; Back to service pros</Link>
      </nav>

      <div className="detail__layout">
        <div className="detail__main">
          {/* Header */}
          <section className="panel pro-head">
            <div className="pro-head__top">
              <span className="pro-head__avatar" aria-hidden="true">
                {initials}
                <i><Icon name="check" size={14} /></i>
              </span>
              <div>
                <h1>
                  {provider.name}
                  <span className="pro-head__badge"><Icon name="shield" size={13} /> {provider.badges[0]}</span>
                </h1>
                <p className="pro-head__role">{provider.role} <small>({provider.licence})</small></p>
                <ul className="pro-head__stats">
                  <li><Icon name="star" size={16} /> <b>{provider.rating}</b> ({provider.reviews} verified reviews)</li>
                  <li><Icon name="shield" size={15} /> {provider.years} Years Exp.</li>
                  <li><Icon name="clock" size={15} /> {provider.onTime}% On-Time Rate</li>
                </ul>
              </div>
            </div>
            <div className="pro-head__coverage">
              <b><Icon name="pin" size={14} /> Coverage:</b>
              {provider.areas.map((a) => <span key={a}>{a}</span>)}
            </div>
          </section>

          {/* About */}
          <section className="panel">
            <div className="panel__head">
              <h2>About the Provider</h2>
              {provider.certs.includes('background') && (
                <span className="panel__badge"><Icon name="check" size={14} /> Background Checked</span>
              )}
            </div>
            <p>
              {provider.blurb} Based in {provider.city}, {provider.name.split(' ')[0]} has
              been working as a {trade.label.toLowerCase()} professional for
              over {provider.years} years and keeps a {provider.onTime}% on-time record.
            </p>
            <div className="terms">
              {highlights.map((h) => (
                <div key={h.title}>
                  <h3><Icon name={h.icon} size={15} /> {h.title}</h3>
                  <p>{h.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Price list */}
          <section className="panel">
            <h2>Services &amp; Standard Rates</h2>
            <p className="panel__sub">Clear pricing with no hidden charges. Final quotes are agreed before work starts.</p>
            <div className="rates" role="table" aria-label="Services and rates">
              <div className="rates__head" role="row">
                <span role="columnheader">Service</span>
                <span role="columnheader">Scope</span>
                <span role="columnheader">Rate</span>
              </div>
              {priceList.map((s) => (
                <div className="rates__row" role="row" key={s.name}>
                  <b role="cell"><Icon name={trade.icon} size={15} /> {s.name}</b>
                  <span role="cell">{s.scope}</span>
                  <em role="cell"><strong>{formatPrice(s.price)}</strong> {s.unit}</em>
                </div>
              ))}
            </div>
          </section>

          {/* Recent work */}
          {provider.showcase && (
            <section className="panel">
              <div className="panel__head">
                <h2>Recent Installations</h2>
                <span className="panel__link">{provider.showcase.length} showcases</span>
              </div>
              <p className="panel__sub">Photos of recent jobs, added by the provider.</p>
              <div className="work">
                {provider.showcase.map((w) => (
                  <figure key={w.title}>
                    <div>
                      <img src={w.image} alt={w.title} loading="lazy" />
                      <span>{w.tag}</span>
                    </div>
                    <figcaption>
                      <b>{w.title}</b>
                      <small>{w.place}</small>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="panel">
            <div className="panel__head">
              <h2>Verified Client Reviews</h2>
              <span className="panel__badge"><Icon name="check" size={14} /> From real bookings</span>
            </div>
            <div className="reviews-list">
              {reviews.map((r) => (
                <article key={r.name}>
                  <header>
                    <div>
                      <b>{r.name}</b> <span>Verified Client</span>
                      <small>{r.where}</small>
                    </div>
                    <div className="reviews-list__stars" aria-label="5 out of 5 stars">
                      {[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" size={14} />)}
                    </div>
                  </header>
                  <blockquote>&ldquo;{r.text}&rdquo;</blockquote>
                  <small>Service: {r.service} · {r.date}</small>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="detail__side">
          <UnlockCard provider={provider} priceList={priceList} />

          <section className="trust">
            <h3><Icon name="shield" size={16} /> Haven Verified</h3>
            <p>
              This provider's identity and credentials were checked before
              they were listed. If something goes wrong, tell us and we will
              follow it up.
            </p>
            <ul className="tags">
              {provider.certs.includes('background') && <li>Background Checked</li>}
              {provider.certs.includes('license') && <li>License Verified</li>}
              {provider.certs.includes('insured') && <li>Insured</li>}
            </ul>
          </section>

          <section className="help-card">
            <div>
              <b>Need help booking?</b>
              <small>Our team is here to help.</small>
            </div>
            <Link to="/messages">Live Chat</Link>
          </section>
        </aside>
      </div>
    </div>
  )
}
