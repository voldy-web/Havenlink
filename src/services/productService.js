// All shop product data goes through this file. The products come from services/catalog.js
// (the database through the API, or the sample data in demo mode) and are filtered here in the browser.
import { loadProducts } from './catalog'

const PER_PAGE = 12

export async function getProducts(filters) {
  const products = await loadProducts()
  const { q, categories, minPrice, maxPrice, vendors, materials, rating, sort, page } = filters
  const text = q.trim().toLowerCase()

  const matches = products.filter((p) => {
    if (text && !`${p.name} ${p.vendor} ${p.material} ${p.description}`.toLowerCase().includes(text)) return false
    if (categories.length && !categories.includes(p.category)) return false
    if (minPrice !== null && p.price < minPrice) return false
    if (maxPrice !== null && p.price > maxPrice) return false
    if (vendors.length && !vendors.includes(p.vendor)) return false
    if (materials.length && !materials.includes(p.material)) return false
    if (p.rating < rating) return false
    return true
  })

  const sorters = {
    recommended: () => 0,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
  }
  const sorted = [...matches].sort(sorters[sort] || sorters.recommended)

  // How many products each category has (ignoring the category filter itself).
  const categoryCounts = {}
  products.forEach((p) => { categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1 })

  const start = (page - 1) * PER_PAGE
  return {
    items: sorted.slice(start, start + PER_PAGE),
    total: sorted.length,
    totalAll: products.length,
    categoryCounts,
    perPage: PER_PAGE,
  }
}

export async function getProductById(id) {
  const products = await loadProducts()
  return products.find((p) => p.id === Number(id)) || null
}

// Other products, preferring the same category.
export async function getRelatedProducts(product, count = 3) {
  const products = await loadProducts()
  const others = products.filter((p) => p.id !== product.id)
  return [
    ...others.filter((p) => p.category === product.category),
    ...others.filter((p) => p.category !== product.category),
  ].slice(0, count)
}

// Used by the cart to show current product details for saved items.
export async function getProductsByIds(ids) {
  const products = await loadProducts()
  return products.filter((p) => ids.includes(p.id))
}
