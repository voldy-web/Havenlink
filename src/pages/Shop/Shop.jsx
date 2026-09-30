import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../../components/cards/ProductCard'
import Pagination from '../../components/ui/Pagination'
import Icon from '../../components/ui/Icon'
import ShopFilters from './ShopFilters'
import { getProducts } from '../../services/productService'
import { parseProductFilters, toProductParams } from '../../utils/productFilters'
import { categories, sortOptions } from '../../data/shopOptions'
import { formatPrice } from '../../utils/format'
import { FREE_DELIVERY_OVER } from '../../services/orderService'
import './Shop.css'

export default function Shop() {
  // The address is the single source of truth for what is filtered.
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseProductFilters(searchParams), [searchParams])
  const key = searchParams.toString()

  const [result, setResult] = useState({ key: null, items: [], total: 0, totalAll: 0, categoryCounts: {}, perPage: 6 })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    let ignore = false
    getProducts(filters).then((r) => {
      if (!ignore) setResult({ key, ...r })
    })
    return () => { ignore = true }
  }, [filters, key])

  const loading = result.key !== key
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage))

  function update(patch) {
    setSearchParams(toProductParams({ ...filters, page: 1, ...patch }))
  }
  function reset() {
    setSearchParams(toProductParams(parseProductFilters(new URLSearchParams())))
  }

  // "Active filter" chips under the title.
  const chips = []
  if (filters.q) chips.push({ label: `"${filters.q}"`, clear: { q: '' } })
  filters.categories.forEach((id) => chips.push({
    label: categories.find((c) => c.id === id)?.label || id,
    clear: { categories: filters.categories.filter((x) => x !== id) },
  }))
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    const from = filters.minPrice !== null ? formatPrice(filters.minPrice) : null
    const to = filters.maxPrice !== null ? formatPrice(filters.maxPrice) : null
    chips.push({
      label: from && to ? `${from} - ${to}` : to ? `Under ${to}` : `Over ${from}`,
      clear: { minPrice: null, maxPrice: null },
    })
  }
  filters.vendors.forEach((v) => chips.push({ label: v, clear: { vendors: filters.vendors.filter((x) => x !== v) } }))
  filters.materials.forEach((m) => chips.push({ label: m, clear: { materials: filters.materials.filter((x) => x !== m) } }))
  if (filters.rating) chips.push({ label: `${filters.rating}+ Stars`, clear: { rating: 0 } })

  return (
    <div className="container shop">
      <header className="shop__head">
        <p className="eyebrow">Home Essentials Marketplace</p>
        <h1>Curated Living &amp; Home Furnishings</h1>
        <p>Beds, couches, appliances and more from trusted vendors, delivered to your new home.</p>
      </header>

      <div className="shop__bar">
        <strong>{loading ? '…' : result.total} <span>{result.total === 1 ? 'item' : 'items'}</span></strong>
        <div className="shop__chips">
          {chips.map((c) => (
            <button key={c.label} onClick={() => update(c.clear)} aria-label={`Remove filter ${c.label}`}>
              {c.label} <Icon name="close" size={11} />
            </button>
          ))}
          {chips.length > 0 && <button className="shop__clear" onClick={reset}>Clear all</button>}
        </div>
        <label className="sort">
          <span>Sort by:</span>
          <select value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
            {sortOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
      </div>

      <div className="shop__layout">
        <button
          className="properties__filter-toggle"
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Icon name="filter" size={16} /> {showFilters ? 'Hide filters' : 'Show filters'}
        </button>

        <aside className={`properties__sidebar ${showFilters ? 'is-open' : ''}`}>
          <ShopFilters
            key={key}
            filters={filters}
            categoryCounts={result.categoryCounts}
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
              <h2>No items match these filters</h2>
              <p>Try removing a filter or choosing another category.</p>
              <button className="active-filters__clear" onClick={reset}>Clear all filters</button>
            </div>
          ) : (
            <div className="shop__grid">
              {result.items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          <div className="properties__pager">
            <p>
              Showing <b>{result.total === 0 ? 0 : (filters.page - 1) * result.perPage + 1}-{Math.min(filters.page * result.perPage, result.total)}</b> of <b>{result.total}</b> items
            </p>
            <Pagination page={filters.page} totalPages={totalPages} onChange={(n) => update({ page: n })} />
            <span />
          </div>
        </section>
      </div>

      <section className="shop__banner">
        <span><Icon name="truck" size={24} /></span>
        <div>
          <h2>Free delivery on orders over {formatPrice(FREE_DELIVERY_OVER)}</h2>
          <p>Choose your delivery day at checkout, and pay online or on delivery.</p>
        </div>
        <Link to="/cart" className="shop__banner-link">View Cart</Link>
      </section>
    </div>
  )
}
