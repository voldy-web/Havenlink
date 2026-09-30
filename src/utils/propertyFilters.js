// Filters live in the page URL (e.g. /properties?type=rent&beds=2), so a
// filtered list can be bookmarked, shared, and the Back button works.
// These two helpers convert between the URL and a plain filters object.

// Price presets sent by the Home page search box.
const pricePresets = {
  low: { minPrice: null, maxPrice: 3000 },
  mid: { minPrice: 3000, maxPrice: 8000 },
  high: { minPrice: 8000, maxPrice: null },
}

const toNumber = (value) =>
  value === null || value === '' || Number.isNaN(Number(value)) ? null : Number(value)

const toList = (value) => (value ? value.split(',').filter(Boolean) : [])

export function parseFilters(params) {
  const preset = pricePresets[params.get('price')] || {}

  // "property" and "feature" are single values sent by the Home page;
  // "types" and "features" are the full comma-separated lists.
  const propertyTypes = toList(params.get('types') || params.get('property'))
  const features = toList(params.get('features') || params.get('feature'))

  return {
    type: params.get('type') === 'buy' ? 'buy' : 'rent',
    location: params.get('location') || '',
    minPrice: toNumber(params.get('min')) ?? preset.minPrice ?? null,
    maxPrice: toNumber(params.get('max')) ?? preset.maxPrice ?? null,
    propertyTypes,
    beds: toNumber(params.get('beds')) || 0,
    baths: toNumber(params.get('baths')) || 0,
    available: params.get('available') || '',
    features,
    verifiedOnly: params.get('verified') === '1',
    sort: params.get('sort') || 'recommended',
    view: params.get('view') === 'list' ? 'list' : 'grid',
    page: toNumber(params.get('page')) || 1,
    perPage: toNumber(params.get('perPage')) || 6,
  }
}

// Only non-default values go into the URL, which keeps links short.
export function toSearchParams(f) {
  const p = new URLSearchParams()
  p.set('type', f.type)
  if (f.location) p.set('location', f.location)
  if (f.minPrice !== null) p.set('min', f.minPrice)
  if (f.maxPrice !== null) p.set('max', f.maxPrice)
  if (f.propertyTypes.length) p.set('types', f.propertyTypes.join(','))
  if (f.beds) p.set('beds', f.beds)
  if (f.baths) p.set('baths', f.baths)
  if (f.available) p.set('available', f.available)
  if (f.features.length) p.set('features', f.features.join(','))
  if (f.verifiedOnly) p.set('verified', '1')
  if (f.sort !== 'recommended') p.set('sort', f.sort)
  if (f.view !== 'grid') p.set('view', f.view)
  if (f.page > 1) p.set('page', f.page)
  if (f.perPage !== 6) p.set('perPage', f.perPage)
  return p
}
