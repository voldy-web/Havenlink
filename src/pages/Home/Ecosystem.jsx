import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { formatPrice } from '../../utils/format'
import { trades, featuredPro, shopPreview } from '../../data/home'
import './Ecosystem.css'

export default function Ecosystem() {
  return (
    <section className="container ecosystem">
      <div className="ecosystem__head">
        <div>
          <p className="eyebrow">Unified Resident Network</p>
          <h2>The Haven Living Ecosystem</h2>
        </div>
        <p>
          Living in a home doesn't stop at the tenancy. Find trusted
          tradespeople and furnish your space, all on your schedule.
        </p>
      </div>

      <div className="ecosystem__grid">
        {/* Services card */}
        <article className="eco-card">
          <div className="eco-card__meta">
            <span className="pill"><Icon name="shield" size={13} /> Verified Trades</span>
            <span className="eco-card__hint">Avg response: 24 mins</span>
          </div>
          <h3>Need a Fix or Seasonal Refresh?</h3>
          <p>
            Book vetted professionals with clear, upfront pricing. Contact
            details unlock for a small fee.
          </p>

          <ul className="trades">
            {trades.map((t) => (
              <li key={t.label}>
                <Link to="/services">
                  <Icon name={t.icon} size={18} />
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="pro-row">
            <span className="pro-row__icon"><Icon name="tool" size={20} /></span>
            <div>
              <b>{featuredPro.name}</b>
              <small>
                <Icon name="star" size={12} /> {featuredPro.rating} ({featuredPro.jobs} jobs completed)
              </small>
            </div>
            <Button to="/services" size="sm">Book Pro</Button>
          </div>

          <div className="eco-card__footer">
            <span>Providers are verified before they are listed</span>
            <Link to="/services">View All Trade Categories &rarr;</Link>
          </div>
        </article>

        {/* Shop card */}
        <article className="eco-card">
          <div className="eco-card__meta">
            <span className="pill"><Icon name="truck" size={13} /> Delivery Available</span>
            <span className="eco-card__hint">Easy Returns</span>
          </div>
          <h3>Curated Essentials Delivered</h3>
          <p>
            Furnish your space without moving-day headaches. Beds, couches
            and appliances delivered to your new home.
          </p>

          <ul className="shop-preview">
            {shopPreview.map((item) => (
              <li key={item.name}>
                <div className="shop-preview__img">
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <span>{formatPrice(item.price)}</span>
                </div>
                <b>{item.name}</b>
                <small>{item.detail}</small>
              </li>
            ))}
          </ul>

          <div className="eco-card__footer">
            <span>Room-by-room furnishing sets</span>
            <Link to="/shop">Explore Haven Living Shop &rarr;</Link>
          </div>
        </article>
      </div>
    </section>
  )
}
