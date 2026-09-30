import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProviderCard from '../../components/cards/ProviderCard'
import Pagination from '../../components/ui/Pagination'
import Icon from '../../components/ui/Icon'
import ServicesFilters from './ServicesFilters'
import { getProviders } from '../../services/providerService'
import { parseProviderFilters, toProviderParams } from '../../utils/providerFilters'
import { trades, sortOptions } from '../../data/serviceCategories'
import './Services.css'

export default function Services() {
  // The address is the single source of truth for what is filtered.
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseProviderFilters(searchParams), [searchParams])
  const key = searchParams.toString()

  const [result, setResult] = useState({ key: null, items: [], total: 0, tradeCounts: {}, totalAll: 0, perPage: 6 })
  const [showFilters, setShowFilters] = useState(false)
  // The two search boxes are edited freely and only applied on "Find Pros".
  const [location, setLocation] = useState(filters.location)
  const [query, setQuery] = useState(filters.q)

  useEffect(() => {
    let ignore = false
    getProviders(filters).then((r) => {
      if (!ignore) setResult({ key, ...r })
    })
    return () => { ignore = true }
  }, [filters, key])

  const loading = result.key !== key
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage))

  function update(patch) {
    setSearchParams(toProviderParams({ ...filters, page: 1, ...patch }))
  }
  function reset() {
    setSearchParams(toProviderParams(parseProviderFilters(new URLSearchParams())))
    setLocation('')
    setQuery('')
  }
  function search(e) {
    e.preventDefault()
    update({ location, q: query })
  }

  const activeTrade = trades.find((t) => t.id === filters.trade)
  const place = filters.location || 'Ghana'

  return (
    <div className="services">
      <section className="services__hero">
        <div className="container">
          <h1>Verified Home Service Pros &amp; Skilled Trades</h1>
          <p>
            Find background-checked plumbers, electricians, carpenters, chefs,
            drivers and more, with clear hourly rates. Unlock a pro's contact
            details for a small fee and book direct.
          </p>

          <form className="services__search" onSubmit={search} role="search">
            <label>
              <span>Service area</span>
              <div>
                <Icon name="pin" size={16} />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Accra, Kumasi, East Legon" />
              </div>
            </label>
            <label>
              <span>Find by need or trade</span>
              <div>
                <Icon name="tool" size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. leaking sink, AC repair, painter" />
              </div>
            </label>
            <button type="submit"><Icon name="search" size={16} /> Find Pros</button>
          </form>

          <div className="chips services__pills">
            <button className={!filters.trade ? 'is-active' : ''} onClick={() => update({ trade: '' })}>
              All Trades ({result.totalAll})
            </button>
            {trades.map((t) => (
              <button
                key={t.id}
                className={filters.trade === t.id ? 'is-active' : ''}
                onClick={() => update({ trade: t.id })}
              >
                {t.pill} ({result.tradeCounts[t.id] || 0})
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        <ul className="tiles">
          {trades.slice(0, 8).map((t) => (
            <li key={t.id}>
              <button
                className={filters.trade === t.id ? 'is-active' : ''}
                onClick={() => update({ trade: t.id })}
              >
                <span><Icon name={t.icon} size={20} /></span>
                <b>{t.label}</b>
                <small>{result.tradeCounts[t.id] || 0} Pros</small>
              </button>
            </li>
          ))}
        </ul>

        <div className="services__layout">
          <button
            className="properties__filter-toggle"
            aria-expanded={showFilters}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Icon name="filter" size={16} /> {showFilters ? 'Hide filters' : 'Show filters'}
          </button>

          <aside className={`properties__sidebar ${showFilters ? 'is-open' : ''}`}>
            <ServicesFilters
              key={key}
              filters={filters}
              onApply={(draft) => {
                update(draft)
                setShowFilters(false)
              }}
              onReset={reset}
            />
          </aside>

          <section>
            <div className="services__bar">
              <p>
                {loading ? 'Searching…' : (
                  <>Showing <b>{result.total}</b> vetted {activeTrade ? activeTrade.label.toLowerCase() : ''} {result.total === 1 ? 'pro' : 'pros'} in {place}</>
                )}
              </p>
              <label className="sort">
                <span>Sort by:</span>
                <select value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
                  {sortOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
            </div>

            {!loading && result.total === 0 ? (
              <div className="properties__empty">
                <h2>No pros match these filters</h2>
                <p>Try a wider area or remove a filter.</p>
                <button className="active-filters__clear" onClick={reset}>Clear all filters</button>
              </div>
            ) : (
              <div className="services__grid">
                {result.items.map((p) => <ProviderCard key={p.id} provider={p} />)}
              </div>
            )}

            <div className="properties__pager">
              <span />
              <Pagination page={filters.page} totalPages={totalPages} onChange={(n) => update({ page: n })} />
              <span />
            </div>
          </section>
        </div>

        <section className="guarantee">
          <span><Icon name="shield" size={22} /></span>
          <div>
            <h2>Haven Verified Pros</h2>
            <p>
              Every provider is checked before they are listed, and reviews come
              only from real bookings. Your payment to unlock a pro is a small,
              clearly shown fee.
            </p>
          </div>
          <Link to="/help" className="guarantee__link">How It Works</Link>
        </section>
      </div>
    </div>
  )
}
