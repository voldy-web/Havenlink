import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PropertyCard from '../../components/cards/PropertyCard'
import Pagination from '../../components/ui/Pagination'
import Icon from '../../components/ui/Icon'
import FilterSidebar from './FilterSidebar'
import { getProperties } from '../../services/propertyService'
import { parseFilters, toSearchParams } from '../../utils/propertyFilters'
import { formatPrice } from '../../utils/format'
import { propertyTypes, comforts, availability, sortOptions } from '../../data/propertyOptions'
import './Properties.css'

export default function Properties() {
  // The URL is the single source of truth for what is filtered.
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])
  const key = searchParams.toString()

  const [result, setResult] = useState({ key: null, items: [], total: 0, typeCounts: {} })
  const [showFilters, setShowFilters] = useState(false)

  // Fetch the matching listings whenever the filters change.
  useEffect(() => {
    let ignore = false
    getProperties(filters).then((r) => {
      if (!ignore) setResult({ key, ...r })
    })
    return () => { ignore = true }
  }, [filters, key])

  const loading = result.key !== key
  const totalPages = Math.max(1, Math.ceil(result.total / filters.perPage))

  // Applies a change to the filters and goes back to page 1.
  function update(patch) {
    setSearchParams(toSearchParams({ ...filters, page: 1, ...patch }))
  }

  function reset() {
    setSearchParams(toSearchParams({ ...parseFilters(new URLSearchParams()), type: filters.type }))
  }

  // Build the "active filter" chips shown under the title.
  const chips = []
  if (filters.location) chips.push({ label: filters.location, clear: { location: '' } })
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    const from = filters.minPrice !== null ? formatPrice(filters.minPrice) : null
    const to = filters.maxPrice !== null ? formatPrice(filters.maxPrice) : null
    const label = from && to ? `${from} - ${to}` : to ? `Under ${to}` : `Over ${from}`
    chips.push({ label, clear: { minPrice: null, maxPrice: null } })
  }
  filters.propertyTypes.forEach((id) => chips.push({
    label: propertyTypes.find((t) => t.id === id)?.label || id,
    clear: { propertyTypes: filters.propertyTypes.filter((x) => x !== id) },
  }))
  if (filters.beds) chips.push({ label: `${filters.beds}+ Beds`, clear: { beds: 0 } })
  if (filters.baths) chips.push({ label: `${filters.baths}+ Baths`, clear: { baths: 0 } })
  if (filters.available) chips.push({
    label: availability.find((a) => a.id === filters.available)?.label,
    clear: { available: '' },
  })
  filters.features.forEach((id) => chips.push({
    label: comforts.find((c) => c.id === id)?.label || id,
    clear: { features: filters.features.filter((x) => x !== id) },
  }))
  if (filters.verifiedOnly) chips.push({ label: 'Haven Verified', clear: { verifiedOnly: false } })

  const first = result.total === 0 ? 0 : (filters.page - 1) * filters.perPage + 1
  const last = Math.min(filters.page * filters.perPage, result.total)

  return (
    <div className="container properties">
      <header className="properties__head">
        <div>
          <h1>
            Homes for {filters.type === 'rent' ? 'Rent' : 'Sale'} in{' '}
            <span>{filters.location || 'Ghana'}</span>
          </h1>
          <p>
            {loading ? 'Searching…' : `${result.total} verified ${result.total === 1 ? 'home matches' : 'homes match'} your search.`}
          </p>
        </div>

        <div className="properties__controls">
          <label className="sort">
            <span>Sort:</span>
            <select value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
              {sortOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>

          <div className="view-toggle" role="group" aria-label="Layout">
            <button
              className={filters.view === 'grid' ? 'is-active' : ''}
              onClick={() => update({ view: 'grid' })}
            >
              <Icon name="grid" size={14} /> Grid
            </button>
            {/* The map view needs a map service, so it is switched off for now. */}
            <button disabled title="Coming soon">
              <Icon name="map" size={14} /> Split Map
            </button>
            <button
              className={filters.view === 'list' ? 'is-active' : ''}
              onClick={() => update({ view: 'list' })}
            >
              <Icon name="list" size={14} /> List
            </button>
          </div>
        </div>
      </header>

      <div className="active-filters">
        <span>Active:</span>
        <b className="active-filters__chip">{filters.type === 'rent' ? 'Rent' : 'Buy'}</b>
        {chips.map((c) => (
          <button
            key={c.label}
            className="active-filters__chip"
            onClick={() => update(c.clear)}
            aria-label={`Remove filter ${c.label}`}
          >
            {c.label} <Icon name="close" size={11} />
          </button>
        ))}
        {chips.length > 0 && (
          <button className="active-filters__clear" onClick={reset}>Clear all filters</button>
        )}
      </div>

      <div className="properties__layout">
        {/* On phones the sidebar sits behind this button. */}
        <button
          className="properties__filter-toggle"
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Icon name="filter" size={16} /> {showFilters ? 'Hide filters' : 'Show filters'}
        </button>

        <aside className={`properties__sidebar ${showFilters ? 'is-open' : ''}`}>
          {/* key = URL, so the sidebar restarts with fresh values when the filters change. */}
          <FilterSidebar
            key={key}
            filters={filters}
            typeCounts={result.typeCounts}
            onApply={(draft) => {
              update(draft)
              setShowFilters(false)
            }}
            onReset={reset}
          />
        </aside>

        <section>
          {!loading && result.total === 0 ? (
            <div className="properties__empty">
              <h2>No homes match these filters</h2>
              <p>Try removing a filter or searching a wider area.</p>
              <button className="active-filters__clear" onClick={reset}>Clear all filters</button>
            </div>
          ) : (
            <div className={`properties__grid properties__grid--${filters.view}`}>
              {result.items.map((p) => (
                <PropertyCard key={p.id} property={p} layout={filters.view} />
              ))}
            </div>
          )}

          <div className="properties__pager">
            <p>
              Showing <b>{first}-{last}</b> of <b>{result.total}</b> homes
            </p>
            <Pagination
              page={filters.page}
              totalPages={totalPages}
              onChange={(n) => update({ page: n })}
            />
            <label className="per-page">
              <span>Per page:</span>
              <select
                value={filters.perPage}
                onChange={(e) => update({ perPage: Number(e.target.value) })}
              >
                <option value="6">6</option>
                <option value="9">9</option>
                <option value="12">12</option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </div>
  )
}
