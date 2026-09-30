import { photo } from './photos'
const bed = photo('shop-bed')
const sofa = photo('shop-sofa')
const fridge = photo('shop-fridge')

// Text and sample numbers for the Home page. Edit here, not in the JSX.

export const heroStats = [
  { icon: 'check', label: '24,000+ Verified Homes' },
  { icon: 'lock', label: '100% Verified Owners' },
  { icon: 'star', label: '4.9 / 5 Service Rating' },
]

// Each popular search sends the visitor to the Properties page with a
// ready-made filter (see utils/propertyFilters.js for the parameters).
export const popularSearches = [
  { label: 'Pet-friendly apartments', params: 'type=rent&property=apartment&feature=pets' },
  { label: 'Furnished studios', params: 'type=rent&property=studio' },
  { label: 'Modern villas', params: 'type=rent&property=house' },
  { label: 'Gated communities', params: 'type=rent&feature=security' },
]

export const propertyFilters = [
  'All',
  'Trending Rentals',
  'Luxury Condos',
  'Family Homes',
  'New Listings',
]

export const steps = [
  {
    number: '01',
    title: 'Discover & Filter',
    text: 'Browse transparent listings with verified owners and filter by neighbourhood, price and property type.',
    link: 'Explore listings',
    to: '/properties',
  },
  {
    number: '02',
    title: 'Book Direct Viewings',
    text: 'Pick a date and time for a viewing and chat directly with the owner, with no endless phone calls.',
    link: 'Book a viewing',
    to: '/properties',
  },
  {
    number: '03',
    title: 'Settle In',
    text: 'Reserve your home, move in, and report any problem in the app so it is tracked until it is fixed.',
    link: 'Report a problem',
    to: '/dashboard',
  },
  {
    number: '04',
    title: 'Furnish & Maintain',
    text: 'Order beds, couches and appliances delivered to your door, and call trusted plumbers or electricians.',
    link: 'Find a pro',
    to: '/services',
  },
]

export const trades = [
  { icon: 'wrench', label: 'Plumbing' },
  { icon: 'bolt', label: 'Electric' },
  { icon: 'sparkle', label: 'Cleaning' },
  { icon: 'fan', label: 'HVAC' },
  { icon: 'hammer', label: 'Carpentry' },
]

export const featuredPro = {
  name: 'Accra Master Plumbers',
  rating: '4.96',
  jobs: 312,
}

export const shopPreview = [
  { name: 'Platform Oak Bed', detail: 'Solid White Oak', price: 2400, image: bed },
  { name: 'Bouclé 3-Seater', detail: 'Cream Textured Fabric', price: 3900, image: sofa },
  { name: 'Inverter Fridge 24cu', detail: 'Energy Star Gold', price: 6800, image: fridge },
]

export const testimonials = [
  {
    initials: 'AK',
    name: 'Ama & Kofi Mensah',
    role: 'Tenants in East Legon',
    text: 'We booked a viewing on Monday, met the owner on Wednesday and had our keys by Friday. Seeing the price upfront with no agent markups was refreshing.',
  },
  {
    initials: 'DO',
    name: 'David Owusu',
    role: 'Apartment Tenant',
    text: 'A pipe burst on a Sunday evening. I reported it in the app, a plumber from the directory arrived within the hour, and my landlord was notified straight away.',
  },
  {
    initials: 'SA',
    name: 'Sarah Addo',
    role: 'Independent Property Owner',
    text: 'I listed my flat and had genuine enquiries within two days. Viewings and messages are all in one place, so I spend no time chasing people.',
  },
]
