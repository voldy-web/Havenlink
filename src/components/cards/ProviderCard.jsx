import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import { formatPrice } from '../../utils/format'
import { trades } from '../../data/serviceCategories'
import './ProviderCard.css'

// One service provider in the directory.
export default function ProviderCard({ provider }) {
  const { id, name, role, rate, rating, reviews, city, areas, badges, blurb, availableText, trade } = provider
  const tradeInfo = trades.find((t) => t.id === trade)
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('')
  const isToday = availableText.startsWith('Available Today')

  return (
    <article className="provider-card">
      <div className="provider-card__body">
        <header>
          <span className="provider-card__avatar" aria-hidden="true">{initials}</span>
          <div>
            <h3><Link to={`/services/${id}`}>{name}</Link></h3>
            <p>{role}</p>
          </div>
          <b className="provider-card__rate">
            {formatPrice(rate)}<small>/hr</small>
          </b>
        </header>

        <p className="provider-card__meta">
          <span><Icon name="star" size={13} /> <b>{rating}</b> ({reviews})</span>
          <span><Icon name="pin" size={13} /> {areas[0]}{areas.length > 1 ? `, ${city}` : ''}</span>
        </p>

        <ul className="provider-card__badges">
          <li className="is-main"><Icon name={tradeInfo.icon} size={12} /> {badges[0]}</li>
          <li>{badges[1]}</li>
        </ul>

        <p className="provider-card__blurb">{blurb}</p>
      </div>

      <footer>
        <span className={isToday ? 'is-now' : ''}>{availableText}</span>
        <Link to={`/services/${id}`} className="provider-card__cta">Unlock Contact &amp; Book</Link>
      </footer>
    </article>
  )
}
