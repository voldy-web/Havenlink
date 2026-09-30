import Icon from './Icon'
import { categories } from '../../data/shopOptions'
import './ProductImage.css'

// Which icon stands in for each category when a product has no photo yet.
const icons = { beds: 'bed', couches: 'home', appliances: 'washer', small: 'bolt', kitchen: 'chef', dining: 'home', wardrobes: 'home', decor: 'sparkle' }

// Shows the product photo, or a tidy illustration tile if there is none.
// To use a real photo, save it as src/assets/photos/product-<id>.jpg.
export default function ProductImage({ product, src, alt, loading = 'lazy' }) {
  const url = src ?? product.image
  // Cut-out appliance photos sit on white, so they are shown whole (not cropped).
  if (url) return <img src={url} alt={alt ?? product.name} loading={loading} className={product.cutout ? 'is-cutout' : undefined} />
  const label = categories.find((c) => c.id === product.category)?.label
  return (
    <div className={`product-art product-art--${product.category}`} role="img" aria-label={`${product.name} (photo coming soon)`}>
      <Icon name={icons[product.category] || 'bag'} size={54} />
      <b>{label}</b>
      <small>Photo coming soon</small>
    </div>
  )
}
