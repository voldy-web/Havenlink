// The choices shown in the Properties filter sidebar.
// Kept in one place so the sidebar, the filter chips and the mock
// listings all agree on the same names.

export const propertyTypes = [
  { id: 'apartment', label: 'Apartments' },
  { id: 'house', label: 'Houses / Villas' },
  { id: 'townhouse', label: 'Townhouses' },
  { id: 'studio', label: 'Studios' },
]

export const comforts = [
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'parking', label: 'Dedicated Parking' },
  { id: 'pets', label: 'Pet Friendly' },
  { id: 'generator', label: 'Backup Generator' },
  { id: 'water', label: 'Water Tank / Borehole' },
  { id: 'security', label: '24/7 Security' },
  { id: 'pool', label: 'Swimming Pool' },
  { id: 'fiber', label: 'Fiber Internet' },
  { id: 'balcony', label: 'Balcony / Patio' },
]

export const availability = [
  { id: 'now', label: 'Immediate Move-in (This Week)' },
  { id: 'month', label: 'Within 30 Days' },
  { id: 'flexible', label: 'Flexible (60+ days)' },
]

export const sortOptions = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'beds-desc', label: 'Most Bedrooms' },
]

// Slider limits for the price filter, per listing type.
export const priceRange = {
  rent: { min: 0, max: 20000, step: 500 },
  buy: { min: 0, max: 5000000, step: 50000 },
}
