import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import { useSaved } from '../../hooks/useSaved'
import { formatPrice } from '../../utils/format'
import { comforts } from '../../data/propertyOptions'
import './PropertyCard.css'

// One property in a grid or list of listings.
// compact: hide the amenity chips (used on the Home page)
// layout:  "grid" (photo on top) or "list" (photo on the left)
export default function PropertyCard({ property, compact = false, layout = 'grid' }) {
  const { id, title, address, area, listingType, price, badge, label, highlight,
    beds, baths, sqm, features, photos, note, action, image } = property

  // Saved homes are remembered in the browser (and shown on the dashboard).
  const { isSaved, toggle } = useSaved()
  const saved = isSaved(id)

  const featureLabels = comforts
    .filter((c) => features?.includes(c.id))
    .slice(0, 3)

  return (
    <article className={`property-card property-card--${layout}`}>
      <Link to={`/properties/${id}`} className="property-card__media">
        <img src={image} alt={title} loading="lazy" />
        <span className={`property-card__badge property-card__badge--${badge.toLowerCase().replace(/\s/g, '-')}`}>
          {badge}
        </span>
        {compact && highlight && (
          <span className="property-card__highlight">{highlight}</span>
        )}
        {!compact && photos && (
          <span className="property-card__highlight">
            <Icon name="camera" size={12} /> 1 / {photos}
          </span>
        )}
      </Link>
      <button
        className={`property-card__heart ${saved ? 'is-saved' : ''}`}
        aria-label={saved ? 'Remove from saved' : 'Save property'}
        aria-pressed={saved}
        onClick={() => toggle(id)}
      >
        <Icon name="heart" size={16} />
      </button>

      <div className="property-card__body">
        <div className="property-card__top">
          <p className="property-card__price">
            {formatPrice(price)}
            <span>{listingType === 'rent' ? ' / mo' : ' Sale'}</span>
          </p>
          <span className="property-card__area">{compact ? area : label}</span>
        </div>
        <h3><Link to={`/properties/${id}`}>{title}</Link></h3>
        <p className="property-card__address">
          {compact ? address : (<><Icon name="pin" size={13} /> {area}, {property.city}</>)}
        </p>

        <ul className="property-card__facts">
          <li><Icon name="bed" size={14} /> {beds} {beds === 1 ? 'Bed' : 'Beds'}</li>
          <li><Icon name="bath" size={14} /> {baths} {baths === 1 ? 'Bath' : 'Baths'}</li>
          <li><Icon name="area" size={14} /> {sqm} sq m</li>
        </ul>

        {!compact && featureLabels.length > 0 && (
          <ul className="property-card__features">
            {featureLabels.map((f) => <li key={f.id}>{f.label}</li>)}
          </ul>
        )}

        <div className="property-card__footer">
          <span className="property-card__note">{note}</span>
          <Button to={`/properties/${id}`} size="sm" variant={action === 'Book Viewing' ? 'primary' : 'secondary'}>
            {action}
          </Button>
        </div>
      </div>
    </article>
  )
}
