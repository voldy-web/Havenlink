import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import { formatPrice } from '../../utils/format'
import { certifications, rateRange } from '../../data/serviceCategories'
// The sidebar looks the same as the Properties one, so it shares its styles.
import '../Properties/FilterSidebar.css'

const availabilityOptions = [
  { id: 'today', label: 'Available Today' },
  { id: 'week', label: 'This Week' },
  { id: 'weekend', label: 'Weekend Service' },
]
const ratingOptions = [
  { value: 0, label: 'Any rating' },
  { value: 4.5, label: '4.5 & Higher' },
  { value: 4.8, label: '4.8 & Higher' },
]

const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

// Edits a private draft; nothing changes until the visitor presses Apply.
export default function ServicesFilters({ filters, onApply, onReset }) {
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
        <legend>Availability</legend>
        {availabilityOptions.map((o) => (
          <label key={o.id} className="check">
            <input
              type="checkbox"
              checked={draft.available.includes(o.id)}
              onChange={() => change({ available: toggle(draft.available, o.id) })}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Minimum Rating</legend>
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

      <fieldset>
        <legend>
          Hourly Rate
          <span>Up to {formatPrice(draft.maxRate ?? rateRange.max)}/hr</span>
        </legend>
        <input
          type="range"
          className="filters__slider"
          aria-label="Maximum hourly rate"
          min={rateRange.min}
          max={rateRange.max}
          step={rateRange.step}
          value={draft.maxRate ?? rateRange.max}
          onChange={(e) => change({ maxRate: Number(e.target.value) })}
        />
      </fieldset>

      <fieldset>
        <legend>Haven Certifications</legend>
        {certifications.map((c) => (
          <label key={c.id} className="check">
            <input
              type="checkbox"
              checked={draft.certs.includes(c.id)}
              onChange={() => change({ certs: toggle(draft.certs, c.id) })}
            />
            <span>{c.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="filters__verified" style={{ cursor: 'default' }}>
        <span>
          <b>Contact Protection</b>
          <small>Phone numbers stay hidden until you unlock a pro for a small fee.</small>
        </span>
      </div>

      <button type="submit" className="filters__apply">
        <Icon name="search" size={16} /> Apply Filters
      </button>
    </form>
  )
}
