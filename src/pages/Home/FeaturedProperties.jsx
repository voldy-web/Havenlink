import { useEffect, useState } from 'react'
import PropertyCard from '../../components/cards/PropertyCard'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { getFeaturedProperties } from '../../services/propertyService'
import { propertyFilters } from '../../data/home'
import './FeaturedProperties.css'

export default function FeaturedProperties() {
  const [properties, setProperties] = useState([])
  const [filter, setFilter] = useState('All')

  // Load the listings once when the section first appears.
  useEffect(() => {
    getFeaturedProperties().then(setProperties)
  }, [])

  // "All" shows everything; other chips show listings with that tag.
  const visible = properties.filter(
    (p) => filter === 'All' || p.categories.includes(filter),
  )

  return (
    <section className="container featured">
      <div className="featured__head">
        <div>
          <p className="eyebrow">Handpicked Residences</p>
          <h2>Featured Properties for Rent &amp; Sale</h2>
        </div>
        <div className="chips">
          {propertyFilters.map((name) => (
            <button
              key={name}
              className={filter === name ? 'is-active' : ''}
              onClick={() => setFilter(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="featured__grid">
          {visible.map((p) => (
            <PropertyCard key={p.id} property={p} compact />
          ))}
        </div>
      ) : (
        <p className="featured__empty">No properties in this category yet.</p>
      )}

      <div className="featured__more">
        <Button to="/properties" variant="outline">
          Browse All Properties <Icon name="arrow" size={14} />
        </Button>
      </div>
    </section>
  )
}
