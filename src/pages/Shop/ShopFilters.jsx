import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import { formatPrice } from '../../utils/format'
import { categories, vendors, materials, priceRange } from '../../data/shopOptions'
// The sidebar looks the same as the Properties one, so it shares its styles.
import '../Properties/FilterSidebar.css'
import './Shop.css'

const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
const ratingOptions = [
  { value: 0, label: 'Any rating' },
  { value: 4.5, label: '4.5+ Stars' },
  { value: 4, label: '4.0+ Stars' },
]

// Edits a private draft; nothing changes until the visitor presses Apply.
export default function ShopFilters({ filters, categoryCounts, onApply, onReset }) {
  const [draft, setDraft] = useState(filters)
  const change = (patch) => setDraft((d) => ({ ...d, ...patch }))

  return (
    <form
      className="filters"
      onSubmit={(e) => {
        e.preventDefault()
        onApply(draft)
      }}
    >
      <div className="filters__head">
        <h2><Icon name="filter" size={18} /> Filters</h2>
        <button type="button" className="filters__reset" onClick={onReset}>Reset all</button>
      </div>

      <fieldset>
        <legend>Categories</legend>
        {categories.map((c) => {
          const count = categoryCounts[c.id] || 0
          return (
            <label key={c.id} className="check">
              <input
                type="checkbox"
                checked={draft.categories.includes(c.id)}
                onChange={() => change({ categories: toggle(draft.categories, c.id) })}
              />
              <span>{c.label}</span>
              <small>{count}</small>
            </label>
          )
        })}
      </fieldset>

      <fieldset>
        <legend>
          Price Range
          <span>{formatPrice(draft.minPrice ?? priceRange.min)} - {formatPrice(draft.maxPrice ?? priceRange.max)}</span>
        </legend>
        <input
          type="range"
          className="filters__slider"
          aria-label="Maximum price"
          min={priceRange.min}
          max={priceRange.max}
          step={priceRange.step}
          value={draft.maxPrice ?? priceRange.max}
          onChange={(e) => change({ maxPrice: Number(e.target.value) })}
        />
        <div className="filters__minmax">
          <label>
            <span>Min</span>
            <input
              type="number"
              min="0"
              value={draft.minPrice ?? ''}
              placeholder={priceRange.min}
              onChange={(e) => change({ minPrice: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </label>
          <label>
            <span>Max</span>
            <input
              type="number"
              min="0"
              value={draft.maxPrice ?? ''}
              placeholder={priceRange.max}
              onChange={(e) => change({ maxPrice: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Vendor &amp; Brand</legend>
        {vendors.map((v) => (
          <label key={v} className="check">
            <input
              type="checkbox"
              checked={draft.vendors.includes(v)}
              onChange={() => change({ vendors: toggle(draft.vendors, v) })}
            />
            <span>{v}</span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Material &amp; Finish</legend>
        <div className="material-chips">
          {materials.map((m) => (
            <button
              key={m}
              type="button"
              className={draft.materials.includes(m) ? 'is-active' : ''}
              aria-pressed={draft.materials.includes(m)}
              onClick={() => change({ materials: toggle(draft.materials, m) })}
            >
              {m}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Rating</legend>
        {ratingOptions.map((o) => (
          <label key={o.value} className="radio">
            <input
              type="radio"
              name="rating"
              checked={draft.rating === o.value}
              onChange={() => change({ rating: o.value })}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </fieldset>

      <button type="submit" className="filters__apply">
        <Icon name="search" size={16} /> Apply Filters
      </button>
    </form>
  )
}
