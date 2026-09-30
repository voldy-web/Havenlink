import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { heroStats, popularSearches } from '../../data/home'
import './HeroSearch.css'

// The four tabs above the search box. Each one sends the visitor
// to a different part of the site when they press Search.
const tabs = [
  { id: 'rent', label: 'Rent', icon: 'key' },
  { id: 'buy', label: 'Buy', icon: 'home' },
  { id: 'service', label: 'Book a Service', icon: 'tool' },
  { id: 'shop', label: 'Shop Essentials', icon: 'bag' },
]

export default function HeroSearch() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('rent')
  const [location, setLocation] = useState('Accra')
  const [type, setType] = useState('all')
  const [price, setPrice] = useState('any')

  function handleSubmit(e) {
    e.preventDefault()
    const params = new URLSearchParams({ location })
    if (tab === 'rent' || tab === 'buy') {
      params.set('type', tab)
      if (type !== 'all') params.set('property', type)
      if (price !== 'any') params.set('price', price)
      navigate(`/properties?${params}`)
    } else if (tab === 'service') {
      navigate(`/services?${params}`)
    } else {
      navigate('/shop')
    }
  }

  return (
    <section className="hero">
      <div className="container">
        <h1>
          Find Your Sanctuary.
          <span>Manage Your Living.</span>
        </h1>
        <p className="hero__lead">
          Explore verified rentals, homes for purchase, certified local
          professionals, and curated home furnishings, all in one trusted hub.
        </p>

        <form className="search-card" onSubmit={handleSubmit}>
          <div className="search-card__tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={tab === t.id ? 'is-active' : ''}
                onClick={() => setTab(t.id)}
              >
                <Icon name={t.icon} size={15} /> {t.label}
              </button>
            ))}
          </div>

          <div className="search-card__fields">
            <label>
              <span>Location / Neighbourhood</span>
              <div>
                <Icon name="pin" size={15} />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. East Legon, Accra"
                />
              </div>
            </label>

            <label>
              <span>Property Type</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House / Villa</option>
                <option value="studio">Studio</option>
              </select>
            </label>

            <label>
              <span>Price Range</span>
              <select value={price} onChange={(e) => setPrice(e.target.value)}>
                <option value="any">Any price</option>
                <option value="low">Under GH₵3,000 / mo</option>
                <option value="mid">GH₵3,000 - GH₵8,000 / mo</option>
                <option value="high">Over GH₵8,000 / mo</option>
              </select>
            </label>

            <button type="submit" className="search-card__submit">
              <Icon name="search" size={16} /> Search
            </button>
          </div>

          <div className="search-card__popular">
            <b>Popular:</b>
            {popularSearches.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(`/properties?${item.params}`)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </form>

        <ul className="hero__stats">
          {heroStats.map((s) => (
            <li key={s.label}>
              <Icon name={s.icon} size={14} /> {s.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
