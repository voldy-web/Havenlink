// All service-provider data goes through this file. Today it filters mock
// data in the browser; later only the inside of these functions changes.
import { providers } from '../data/providers'
import { trades } from '../data/serviceCategories'

const PER_PAGE = 6

const matchesText = (p, text) =>
  `${p.name} ${p.role} ${p.blurb} ${p.badges.join(' ')} ${trades.find((t) => t.id === p.trade)?.label}`
    .toLowerCase()
    .includes(text)

export async function getProviders(filters) {
  const { trade, location, q, available, rating, maxRate, certs, sort, page } = filters
  const place = location.trim().toLowerCase()
  const text = q.trim().toLowerCase()

  // Count providers per trade using every filter EXCEPT the trade itself,
  // so the trade pills always show what each one would give.
  const base = providers.filter((p) => {
    if (place && !`${p.city} ${p.areas.join(' ')}`.toLowerCase().includes(place)) return false
    if (text && !matchesText(p, text)) return false
    if (available.length && !available.some((a) => p.available.includes(a))) return false
    if (p.rating < rating) return false
    if (maxRate !== null && p.rate > maxRate) return false
    // A pro must hold EVERY selected certification.
    if (!certs.every((c) => p.certs.includes(c))) return false
    return true
  })

  const tradeCounts = {}
  base.forEach((p) => { tradeCounts[p.trade] = (tradeCounts[p.trade] || 0) + 1 })

  const matches = base.filter((p) => !trade || p.trade === trade)
  const sorters = {
    rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
    'price-asc': (a, b) => a.rate - b.rate,
    'price-desc': (a, b) => b.rate - a.rate,
    reviews: (a, b) => b.reviews - a.reviews,
  }
  const sorted = [...matches].sort(sorters[sort] || sorters.rating)
  const start = (page - 1) * PER_PAGE

  return {
    items: sorted.slice(start, start + PER_PAGE),
    total: sorted.length,
    tradeCounts,
    totalAll: base.length,
    perPage: PER_PAGE,
  }
}

export async function getProviderById(id) {
  return providers.find((p) => p.id === Number(id)) || null
}

// ---- Paid contact unlocks / service requests ----
// Saved in the browser for now (localStorage). Only the payment METHOD is
// kept - card details are never stored. The backend will handle real
// payments and store these records in the database.
const REQUESTS_KEY = 'havenlink_service_requests'

function readRequests() {
  try {
    return JSON.parse(localStorage.getItem(REQUESTS_KEY)) || []
  } catch {
    return []
  }
}

export async function createServiceRequest(details) {
  const request = {
    ...details,
    reference: `HL-S-${Date.now().toString().slice(-6)}`,
    paymentStatus: 'Paid',
    createdAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify([request, ...readRequests()]))
  } catch {
    // Storage can be blocked (private browsing). The result still shows on screen.
  }
  return request
}

export async function getMyServiceRequests() {
  return readRequests()
}
