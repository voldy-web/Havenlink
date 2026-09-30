import { trades } from '../data/serviceCategories'

const round5 = (n) => Math.max(5, Math.round(n / 5) * 5)

// Builds the price list, highlights and reviews shown on a provider's page
// from their basic details. The backend will supply real ones later.
export function buildProfile(p) {
  const trade = trades.find((t) => t.id === p.trade)

  const priceList = trade.services.map((s) => ({
    name: s.name,
    scope: s.scope,
    price: round5(p.rate * s.factor),
    unit: s.unit,
  }))

  const highlights = [
    { icon: 'shield', title: p.licence, text: 'Credentials checked by Haven Link' },
    { icon: 'tool', title: `${p.years} Years Experience`, text: `${p.onTime}% on-time record` },
    { icon: 'check', title: 'Tidy Workmanship', text: 'Clean finish, floors protected' },
  ]

  const reviews = [
    { name: 'Akosua Darko', where: 'Tenant, East Legon', service: priceList[0].name, date: 'August 2026',
      text: 'Arrived on time, explained the problem clearly and finished the job the same day. Very professional.' },
    { name: 'Kofi Adjei', where: 'Homeowner, Cantonments', service: (priceList[1] || priceList[0]).name, date: 'July 2026',
      text: 'Fair price and neat work, and they cleaned up afterwards. I would book again without hesitation.' },
    { name: 'Naa Lamptey', where: 'Tenant, Osu', service: priceList[0].name, date: 'June 2026',
      text: 'Quick to respond and easy to reach once I had unlocked the contact. Highly recommended.' },
  ]

  return { trade, priceList, highlights, reviews }
}

// The contact details revealed after a client pays the unlock fee.
// These are placeholders (0000 numbers and example.com are reserved for
// examples); the real details will come from each provider's account.
export function providerContact(p) {
  const [first, ...rest] = p.name.toLowerCase().replace(/[^a-z ]/g, '').split(' ')
  return {
    phone: `+233 20 000 ${String(p.id).padStart(4, '0')}`,
    phoneLink: `+233200000${String(p.id).padStart(3, '0')}`,
    email: `${first}${rest.length ? `.${rest[rest.length - 1]}` : ''}@example.com`,
  }
}
