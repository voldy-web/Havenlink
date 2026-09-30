// Shop filters live in the page address (for example
// /shop?category=beds&max=3000), like the Properties and Services pages.
const toNumber = (v) => (v === null || v === '' || Number.isNaN(Number(v)) ? null : Number(v))
const toList = (v) => (v ? v.split(',').filter(Boolean) : [])

export function parseProductFilters(params) {
  return {
    q: params.get('q') || '',
    categories: toList(params.get('category')),
    minPrice: toNumber(params.get('min')),
    maxPrice: toNumber(params.get('max')),
    vendors: toList(params.get('vendors')),
    materials: toList(params.get('materials')),
    rating: toNumber(params.get('rating')) || 0,
    sort: params.get('sort') || 'recommended',
    page: toNumber(params.get('page')) || 1,
  }
}

export function toProductParams(f) {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.categories.length) p.set('category', f.categories.join(','))
  if (f.minPrice !== null) p.set('min', f.minPrice)
  if (f.maxPrice !== null) p.set('max', f.maxPrice)
  if (f.vendors.length) p.set('vendors', f.vendors.join(','))
  if (f.materials.length) p.set('materials', f.materials.join(','))
  if (f.rating) p.set('rating', f.rating)
  if (f.sort !== 'recommended') p.set('sort', f.sort)
  if (f.page > 1) p.set('page', f.page)
  return p
}
