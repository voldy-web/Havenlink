// 50 more mock homes, written as compact rows and expanded into full listings
// below. Later these come from the backend. Each row:
// [title, area, city, 'rent'|'buy', propertyType, beds, baths, sqm, price, features]
import { photo } from './photos'

// Where each area is on the map (approximate). A tiny offset per listing
// stops pins from sitting exactly on top of each other.
const places = {
  'East Legon': [5.635, -0.155], Cantonments: [5.576, -0.174], 'Airport Residential': [5.603, -0.18],
  Osu: [5.556, -0.183], Labone: [5.565, -0.17], Ridge: [5.562, -0.199], Dzorwulu: [5.61, -0.195],
  Spintex: [5.636, -0.1], Adenta: [5.71, -0.16], Madina: [5.68, -0.165], Labadi: [5.56, -0.145],
  'Trasacco Valley': [5.648, -0.123], Haatso: [5.66, -0.19], 'East Legon Hills': [5.65, -0.13],
  'Community 25': [5.67, 0.0], Nhyiaeso: [6.672, -1.617], Ahodwo: [6.669, -1.605], Adum: [6.69, -1.624],
  Santasi: [6.65, -1.64], Asokwa: [6.66, -1.59], 'Beach Road': [4.896, -1.756], Anaji: [4.92, -1.74],
  'Airport Ridge': [4.895, -1.777], Abura: [5.115, -1.25], Lamashegu: [9.43, -0.87], Sakasaka: [9.405, -0.84],
  'Millennium City': [5.54, -0.43],
}

const rows = [
  ['Lakeside Family Home', 'Trasacco Valley', 'Accra', 'rent', 'house', 4, 3, 260, 13500, ['pool', 'security', 'generator', 'parking']],
  ['Osu Studio Retreat', 'Osu', 'Accra', 'rent', 'studio', 1, 1, 48, 2600, ['fiber', 'ac']],
  ['Cantonments Garden Apartment', 'Cantonments', 'Accra', 'rent', 'apartment', 2, 2, 110, 6900, ['ac', 'security', 'parking', 'balcony']],
  ['Ridge Executive Penthouse', 'Ridge', 'Accra', 'buy', 'apartment', 3, 3, 190, 2350000, ['pool', 'security', 'parking', 'ac', 'balcony']],
  ['Labone Courtyard Townhouse', 'Labone', 'Accra', 'rent', 'townhouse', 3, 3, 175, 9800, ['ac', 'security', 'parking', 'generator']],
  ['East Legon Modern Villa', 'East Legon', 'Accra', 'buy', 'house', 5, 5, 420, 4200000, ['pool', 'security', 'generator', 'parking', 'ac']],
  ['Adenta Starter Flat', 'Adenta', 'Accra', 'rent', 'apartment', 1, 1, 58, 1800, ['water', 'parking']],
  ['Spintex Riverside Apartment', 'Spintex', 'Accra', 'rent', 'apartment', 2, 2, 92, 3900, ['ac', 'parking', 'generator', 'fiber']],
  ['Kumasi Ahodwo Family House', 'Ahodwo', 'Kumasi', 'rent', 'house', 4, 3, 230, 8200, ['security', 'generator', 'parking', 'water']],
  ['Nhyiaeso Hilltop Apartment', 'Nhyiaeso', 'Kumasi', 'rent', 'apartment', 2, 2, 100, 4300, ['ac', 'balcony', 'security']],
  ['Adum City Studio', 'Adum', 'Kumasi', 'rent', 'studio', 1, 1, 45, 2100, ['fiber', 'water']],
  ['Santasi Comfort Townhouse', 'Santasi', 'Kumasi', 'rent', 'townhouse', 3, 2, 150, 5600, ['parking', 'generator', 'security']],
  ['Asokwa Garden Home', 'Asokwa', 'Kumasi', 'buy', 'house', 4, 3, 250, 1650000, ['security', 'parking', 'generator', 'water']],
  ['Beach Road Ocean Flat', 'Beach Road', 'Takoradi', 'rent', 'apartment', 2, 2, 95, 3600, ['balcony', 'ac', 'water']],
  ['Anaji Executive Villa', 'Anaji', 'Takoradi', 'buy', 'house', 4, 4, 280, 2100000, ['pool', 'security', 'generator', 'parking']],
  ['Airport Ridge Studio Loft', 'Airport Ridge', 'Takoradi', 'rent', 'studio', 1, 1, 52, 2300, ['fiber', 'ac']],
  ['Abura Coastal Cottage', 'Abura', 'Cape Coast', 'rent', 'house', 3, 2, 140, 4100, ['water', 'parking', 'balcony']],
  ['Lamashegu Courtyard House', 'Lamashegu', 'Tamale', 'rent', 'house', 3, 2, 160, 3200, ['generator', 'water', 'parking']],
  ['Sakasaka Budget Apartment', 'Sakasaka', 'Tamale', 'rent', 'apartment', 2, 1, 70, 1900, ['water', 'parking']],
  ['Millennium City Family Home', 'Millennium City', 'Kasoa', 'buy', 'house', 4, 3, 210, 980000, ['security', 'parking', 'water']],
  ['Community 25 Modern Apartment', 'Community 25', 'Tema', 'rent', 'apartment', 2, 2, 88, 3400, ['ac', 'parking', 'security']],
  ['Dzorwulu Quiet Apartment', 'Dzorwulu', 'Accra', 'rent', 'apartment', 2, 2, 105, 5800, ['ac', 'parking', 'generator', 'security']],
  ['Madina Value Studio', 'Madina', 'Accra', 'rent', 'studio', 1, 1, 42, 1500, ['water', 'fiber']],
  ['Haatso Terrace Home', 'Haatso', 'Accra', 'rent', 'townhouse', 3, 3, 165, 7200, ['parking', 'generator', 'security', 'balcony']],
  ['Labadi Beachfront Apartment', 'Labadi', 'Accra', 'buy', 'apartment', 2, 2, 105, 1250000, ['balcony', 'pool', 'security', 'ac']],
  ['Airport Residential Garden Suite', 'Airport Residential', 'Accra', 'rent', 'apartment', 1, 1, 66, 4700, ['ac', 'security', 'pets']],
  ['East Legon Hills Family Villa', 'East Legon Hills', 'Accra', 'rent', 'house', 5, 4, 330, 15800, ['pool', 'security', 'generator', 'parking', 'ac']],
  ['Osu Oxford Street Loft', 'Osu', 'Accra', 'buy', 'apartment', 1, 1, 72, 720000, ['fiber', 'ac', 'security']],
  ['Cantonments Diplomat Residence', 'Cantonments', 'Accra', 'buy', 'house', 5, 5, 380, 3900000, ['pool', 'security', 'generator', 'parking', 'ac']],
  ['Spintex Compact Townhouse', 'Spintex', 'Accra', 'buy', 'townhouse', 3, 3, 155, 1350000, ['parking', 'generator', 'security']],
  ['Adenta Family Bungalow', 'Adenta', 'Accra', 'rent', 'house', 3, 2, 170, 4800, ['parking', 'water', 'generator']],
  ['Ridge Business Apartment', 'Ridge', 'Accra', 'rent', 'apartment', 2, 2, 98, 7400, ['ac', 'fiber', 'parking', 'security']],
  ['Ahodwo Garden Studio', 'Ahodwo', 'Kumasi', 'rent', 'studio', 1, 1, 50, 2400, ['fiber', 'security']],
  ['Nhyiaeso Executive Home', 'Nhyiaeso', 'Kumasi', 'buy', 'house', 5, 4, 300, 2450000, ['pool', 'security', 'generator', 'parking']],
  ['Santasi Modern Apartment', 'Santasi', 'Kumasi', 'buy', 'apartment', 2, 2, 90, 680000, ['ac', 'parking', 'security']],
  ['Beach Road Sunset Villa', 'Beach Road', 'Takoradi', 'rent', 'house', 4, 3, 240, 9400, ['pool', 'security', 'generator', 'parking']],
  ['Anaji Family Apartment', 'Anaji', 'Takoradi', 'rent', 'apartment', 3, 2, 120, 4200, ['parking', 'water', 'generator']],
  ['Abura Ocean View Flat', 'Abura', 'Cape Coast', 'buy', 'apartment', 2, 2, 85, 540000, ['balcony', 'water', 'security']],
  ['Lamashegu Gated Townhouse', 'Lamashegu', 'Tamale', 'buy', 'townhouse', 3, 3, 145, 620000, ['security', 'generator', 'water']],
  ['Sakasaka Family Compound', 'Sakasaka', 'Tamale', 'rent', 'house', 4, 3, 200, 3800, ['generator', 'water', 'parking', 'security']],
  ['Community 25 Family House', 'Community 25', 'Tema', 'buy', 'house', 4, 3, 220, 1450000, ['security', 'parking', 'generator', 'water']],
  ['Millennium City Starter Home', 'Millennium City', 'Kasoa', 'rent', 'house', 2, 1, 95, 2200, ['water', 'parking']],
  ['East Legon Skyline Apartment', 'East Legon', 'Accra', 'rent', 'apartment', 3, 3, 145, 8800, ['pool', 'ac', 'security', 'parking', 'balcony']],
  ['Labone Design Studio', 'Labone', 'Accra', 'rent', 'studio', 1, 1, 55, 3300, ['ac', 'fiber', 'security']],
  ['Dzorwulu Executive Townhouse', 'Dzorwulu', 'Accra', 'buy', 'townhouse', 4, 4, 240, 2750000, ['pool', 'security', 'parking', 'generator']],
  ['Haatso Garden Flat', 'Haatso', 'Accra', 'rent', 'apartment', 2, 1, 78, 2900, ['water', 'parking', 'pets']],
  ['Madina Family Duplex', 'Madina', 'Accra', 'buy', 'house', 4, 3, 200, 1180000, ['security', 'parking', 'generator']],
  ['Labadi Sea Breeze Studio', 'Labadi', 'Accra', 'rent', 'studio', 1, 1, 50, 2700, ['balcony', 'fiber']],
  ['Dzorwulu Garden Duplex', 'Dzorwulu', 'Accra', 'rent', 'townhouse', 3, 3, 168, 8600, ['ac', 'parking', 'generator', 'security', 'pets']],
  ['Trasacco Estate Townhouse', 'Trasacco Valley', 'Accra', 'rent', 'townhouse', 4, 4, 235, 12800, ['pool', 'security', 'generator', 'parking', 'ac']],
]

const photosFor = {
  house: ['property-villa', 'home-garden-lounge', 'detail-living', 'property-penthouse'],
  townhouse: ['property-lake', 'home-hero-lounge', 'property-villa', 'home-sofa-lounge'],
  apartment: ['property-monarch', 'property-terrace', 'home-city-lounge', 'home-hero-lounge', 'home-sofa-lounge', 'home-night-loft', 'property-lake'],
  studio: ['property-loft', 'home-brick-loft', 'property-dining', 'home-night-loft'],
}
const labels = ['High Demand', 'Premium', 'Just Listed', 'Deposit: 1 Mo', 'Quiet Street', 'Great Value', 'Family Friendly', 'City Views']
const notes = ['No Agent Fee', 'Move in immediately', 'Pet friendly', 'Lease: 12-24 months', 'Direct Owner Host', 'Haven Certified Agent', 'Valuation Report Ready', 'Viewing this week']
const move = ['now', 'now', 'month', 'flexible']

export const moreProperties = rows.map(([title, area, city, listingType, propertyType, beds, baths, sqm, price, features], i) => {
  const id = 16 + i
  const reserved = i % 9 === 4
  const list = photosFor[propertyType]
  const [lat, lng] = places[area]
  const luxury = listingType === 'buy' ? price > 1500000 : price > 8500
  const categories = []
  if (luxury || (listingType === 'buy' && propertyType === 'apartment')) categories.push('Luxury Condos')
  if (beds >= 3) categories.push('Family Homes')
  if (i % 4 === 0) categories.push('Trending Rentals')
  if (i % 5 === 1) categories.push('New Listings')
  return {
    id,
    agentId: (i % 3) + 1,
    lat: lat + ((i * 37) % 11) * 0.0006,
    lng: lng + ((i * 53) % 11) * 0.0006,
    title, address: `${(i * 7) % 40 + 2} ${area} Road, ${city}`, area, city, listingType, propertyType, price,
    status: reserved ? 'Reserved' : 'Available',
    badge: reserved ? 'Reserved' : i % 6 === 1 ? 'New Listing' : i % 5 === 2 ? 'Verified' : 'Available',
    label: reserved ? 'Under Review' : labels[i % labels.length],
    beds, baths, sqm, features,
    available: move[i % move.length],
    verified: i % 7 !== 3,
    photos: 6 + (i % 5) * 3,
    note: reserved ? 'Waitlist Open' : notes[i % notes.length],
    action: reserved ? 'Join Waitlist' : listingType === 'buy' ? 'Explore Details' : 'Book Viewing',
    categories,
    image: photo(list[i % list.length]),
  }
})
