// All property data goes through this file. The homes come from services/catalog.js
// (the database through the API, or the sample data in demo mode) and are filtered
// here in the browser.
import { agents } from '../data/agents'
import { loadProperties } from './catalog'

export async function getFeaturedProperties() {
  const properties = await loadProperties()
  return properties.filter((p) => p.featured)
}

// Returns one page of listings that match the filters, plus the total
// number of matches and how many listings exist per property type.
export async function getProperties(filters) {
  const properties = await loadProperties()
  const {
    type, location, minPrice, maxPrice, propertyTypes, beds, baths,
    available, features, verifiedOnly, sort, page, perPage,
  } = filters

  const search = location.trim().toLowerCase()
  const inIntent = properties.filter((p) => p.listingType === type)

  const matches = inIntent.filter((p) => {
    if (search && !`${p.city} ${p.area} ${p.address}`.toLowerCase().includes(search)) return false
    if (minPrice !== null && p.price < minPrice) return false
    if (maxPrice !== null && p.price > maxPrice) return false
    if (propertyTypes.length && !propertyTypes.includes(p.propertyType)) return false
    if (p.beds < beds || p.baths < baths) return false
    if (available && p.available !== available) return false
    // A listing must have EVERY selected comfort.
    if (!features.every((f) => p.features.includes(f))) return false
    if (verifiedOnly && !p.verified) return false
    return true
  })

  const sorters = {
    recommended: () => 0,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    'beds-desc': (a, b) => b.beds - a.beds,
  }
  const sorted = [...matches].sort(sorters[sort] || sorters.recommended)

  const start = (page - 1) * perPage
  const typeCounts = {}
  inIntent.forEach((p) => {
    typeCounts[p.propertyType] = (typeCounts[p.propertyType] || 0) + 1
  })

  return {
    items: sorted.slice(start, start + perPage),
    total: sorted.length,
    typeCounts,
  }
}

// One listing by its id (from the page address), or null if it doesn't exist.
export async function getPropertyById(id) {
  const properties = await loadProperties()
  return properties.find((p) => p.id === Number(id)) || null
}

// Other listings of the same kind, preferring the same city.
export async function getSimilarProperties(property, count = 2) {
  const properties = await loadProperties()
  const others = properties.filter(
    (p) => p.id !== property.id && p.listingType === property.listingType,
  )
  const sameCity = others.filter((p) => p.city === property.city)
  const rest = others.filter((p) => p.city !== property.city)
  return [...sameCity, ...rest].slice(0, count)
}

// The agent or owner who looks after a listing.
export async function getAgentById(id) {
  return agents.find((a) => a.id === id) || null
}
