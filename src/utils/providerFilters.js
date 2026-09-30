// Directory filters live in the page address (for example
// /services?trade=plumbing&rating=4.8), like the Properties page.
const toNumber = (v) => (v === null || v === '' || Number.isNaN(Number(v)) ? null : Number(v))
const toList = (v) => (v ? v.split(',').filter(Boolean) : [])

export function parseProviderFilters(params) {
  return {
    trade: params.get('trade') || '',
    location: params.get('location') || '',
    q: params.get('q') || '',
    available: toList(params.get('available')),
    rating: toNumber(params.get('rating')) || 0,
    maxRate: toNumber(params.get('maxRate')),
    certs: toList(params.get('certs')),
    sort: params.get('sort') || 'rating',
    page: toNumber(params.get('page')) || 1,
  }
}

export function toProviderParams(f) {
  const p = new URLSearchParams()
  if (f.trade) p.set('trade', f.trade)
  if (f.location) p.set('location', f.location)
  if (f.q) p.set('q', f.q)
  if (f.available.length) p.set('available', f.available.join(','))
  if (f.rating) p.set('rating', f.rating)
  if (f.maxRate !== null) p.set('maxRate', f.maxRate)
  if (f.certs.length) p.set('certs', f.certs.join(','))
  if (f.sort !== 'rating') p.set('sort', f.sort)
  if (f.page > 1) p.set('page', f.page)
  return p
}
