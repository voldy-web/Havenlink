import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import { formatPrice } from '../../utils/format'
import {
  propertyTypes, comforts, availability, priceRange,
} from '../../data/propertyOptions'
import './FilterSidebar.css'

const bedOptions = [
  { value: 0, label: 'Any' }, { value: 1, label: '1' }, { value: 2, label: '2' },
  { value: 3, label: '3' }, { value: 4, label: '4+' },
]
const bathOptions = [
  { value: 0, label: 'Any' }, { value: 1, label: '1' },
  { value: 2, label: '2+' }, { value: 3, label: '3+' },
]

// Adds `id` to a list if missing, removes it if present.
const toggle = (list, id) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id]

// The sidebar edits a private "draft" copy of the filters. Nothing changes
// on the page until the visitor presses Apply, like in the design.
export default function FilterSidebar({ filters, typeCounts, onApply, onReset }) {
  const [draft, setDraft] = useState(filters)
  const change = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const range = priceRange[draft.type]

  return (
    <form
      className="filters"
      onSubmit={(e) => {
        e.preventDefault()
        onApply(draft)
      }}
    >
      <div className="filters__head">
        <h2><Icon name="filter" size={18} /> Filter Homes</h2>
        <button type="button" className="filters__reset" onClick={onReset}>Reset</button>
      </div>

      <fieldset>
        <legend>Intent</legend>
        <div className="segmented segmented--wide">
          {['rent', 'buy'].map((t) => (
            <button
              key={t}
              type="button"
              className={draft.type === t ? 'is-active' : ''}
              // Rent and sale prices are very different, so switching clears the price.
              onClick={() => change({ type: t, minPrice: null, maxPrice: null })}
            >
              {t === 'rent' ? 'Rent' : 'Buy'}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Location</legend>
        <label className="filters__input">
          <Icon name="pin" size={15} />
          <input
            value={draft.location}
            onChange={(e) => change({ location: e.target.value })}
            placeholder="City or neighbourhood"
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>
          {draft.type === 'rent' ? 'Monthly Budget' : 'Price'}
          <span>
            {formatPrice(draft.minPrice ?? range.min)} - {formatPrice(draft.maxPrice ?? range.max)}
          </span>
        </legend>
        <input
          type="range"
          className="filters__slider"
          aria-label="Maximum price"
          min={range.min}
          max={range.max}
          step={range.step}
          value={draft.maxPrice ?? range.max}
          onChange={(e) => change({ maxPrice: Number(e.target.value) })}
        />
        <div className="filters__minmax">
          <label>
            <span>Min</span>
            <input
              type="number"
              min="0"
              step={range.step}
              value={draft.minPrice ?? ''}
              placeholder={range.min}
              onChange={(e) => change({ minPrice: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </label>
          <label>
            <span>Max</span>
            <input
              type="number"
              min="0"
              step={range.step}
              value={draft.maxPrice ?? ''}
              placeholder={range.max}
              onChange={(e) => change({ maxPrice: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Property Type</legend>
        {propertyTypes.map((t) => (
          <label key={t.id} className="check">
            <input
              type="checkbox"
              checked={draft.propertyTypes.includes(t.id)}
              onChange={() => change({ propertyTypes: toggle(draft.propertyTypes, t.id) })}
            />
            <span>{t.label}</span>
            <small>{typeCounts[t.id] || 0}</small>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Bedrooms</legend>
        <div className="segmented">
          {bedOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              className={draft.beds === o.value ? 'is-active' : ''}
              onClick={() => change({ beds: o.value })}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Bathrooms</legend>
        <div className="segmented">
          {bathOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              className={draft.baths === o.value ? 'is-active' : ''}
              onClick={() => change({ baths: o.value })}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Move-in</legend>
        {availability.map((a) => (
          <label key={a.id} className="radio">
            <input
              type="radio"
              name="available"
              checked={draft.available === a.id}
              // Clicking the selected option again clears it.
              onClick={() => draft.available === a.id && change({ available: '' })}
              onChange={() => change({ available: a.id })}
            />
            <span>{a.label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Comforts</legend>
        {comforts.map((c) => (
          <label key={c.id} className="check">
            <input
              type="checkbox"
              checked={draft.features.includes(c.id)}
              onChange={() => change({ features: toggle(draft.features, c.id) })}
            />
            <span>{c.label}</span>
          </label>
        ))}
      </fieldset>

      <label className="filters__verified">
        <span>
          <b>Haven Verified Only</b>
          <small>Owner and listing checked</small>
        </span>
        <input
          type="checkbox"
          checked={draft.verifiedOnly}
          onChange={(e) => change({ verifiedOnly: e.target.checked })}
        />
      </label>

      <button type="submit" className="filters__apply">
        <Icon name="search" size={16} /> Apply Filters
      </button>
    </form>
  )
}
