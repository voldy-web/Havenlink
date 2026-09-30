import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import ProductImage from '../ui/ProductImage'
import { useCart } from '../../hooks/useCart'
import { defaultChoices, unitPriceFor } from '../../utils/productHelpers'
import { formatPrice } from '../../utils/format'
import './ProductCard.css'

// One product in the shop grid.
export default function ProductCard({ product }) {
  const { id, name, vendor, rating, reviews, badge, tag, dims, feature, delivery, price, oldPrice, stock } = product
  const { addItem } = useCart()
  const [saved, setSaved] = useState(false)
  const [added, setAdded] = useState(false)

  // Adds the first choice of each option. Buyers can pick others on the product page.
  function add() {
    const choices = defaultChoices(product)
    addItem(id, unitPriceFor(product, choices), 1, choices)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <article className="product-card">
      <Link to={`/shop/${id}`} className="product-card__media">
        <ProductImage product={product} />
        <span className="product-card__badge">{badge}</span>
        <span className="product-card__tag">{tag}</span>
      </Link>
      <button
        className={`product-card__heart ${saved ? 'is-saved' : ''}`}
        aria-label={saved ? 'Remove from saved' : 'Save item'}
        aria-pressed={saved}
        onClick={() => setSaved(!saved)}
      >
        <Icon name="heart" size={16} />
      </button>

      <div className="product-card__body">
        <div className="product-card__top">
          <span>{vendor}</span>
          <span><Icon name="star" size={12} /> <b>{rating}</b> ({reviews})</span>
        </div>
        <h3><Link to={`/shop/${id}`}>{name}</Link></h3>
        <p className="product-card__spec"><em>{dims}</em> {feature}</p>

        <div className="product-card__buy">
          <div>
            <b>{formatPrice(price)}</b>
            {oldPrice && <s>{formatPrice(oldPrice)}</s>}
            <small>{delivery}</small>
          </div>
          <button onClick={add} disabled={stock === 0} aria-live="polite">
            <Icon name={added ? 'check' : 'bag'} size={15} /> {stock === 0 ? 'Sold out' : added ? 'Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  )
}
