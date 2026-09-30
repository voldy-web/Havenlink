import { photo } from './photos'

// Mock service providers. Later these come from the backend
// (see src/services/providerService.js).
//   available   'today' | 'week' | 'weekend'  (every slot the pro offers)
//   certs       ids from data/serviceCategories.js
//   fee         one-off fee to unlock the pro's contact details (GH₵)
//   showcase    optional photos of recent work
const pipes = photo('work-pipes')
const faucet = photo('work-faucet')
const pump = photo('work-pump')

const plumbingWork = [
  { image: pipes, tag: 'Completed March', title: 'Copper Pipe Reroute & Manifold', place: 'East Legon · House 12' },
  { image: faucet, tag: 'Fixture Upgrade', title: 'Designer Matte Black Faucet Install', place: 'Cantonments · Apartment 4' },
  { image: pump, tag: 'Pressure Fix', title: 'Booster Pump & Pressure Valve', place: 'Airport Residential · Villa 7' },
]

export const providers = [
  {
    id: 1, name: 'Kwame Boateng', trade: 'plumbing', role: 'Master Plumber & Leak Specialist',
    rate: 120, rating: 4.9, reviews: 182, years: 14, onTime: 100, city: 'Accra',
    areas: ['Osu', 'Cantonments', 'Labone', 'Airport Residential', 'East Legon'],
    badges: ['Haven Verified Pro', '24/7 Urgent'], available: ['today', 'week', 'weekend'],
    availableText: 'Available Today', certs: ['license', 'insured', 'background', 'emergency'],
    blurb: 'Over 14 years tackling high-pressure water mains, leak detection, kitchen drainage and modern bathroom fittings.',
    fee: 15, licence: 'Lic #GH-PL-84092', showcase: plumbingWork,
  },
  {
    id: 2, name: 'Efua Owusu', trade: 'electrical', role: 'Licensed Electrician',
    rate: 150, rating: 4.95, reviews: 240, years: 12, onTime: 99, city: 'Accra',
    areas: ['East Legon', 'Spintex', 'Tema', 'Adenta'],
    badges: ['Master Certified', 'Solar & Backup Power'], available: ['week', 'weekend'],
    availableText: 'Next slot: Tomorrow 9 AM', certs: ['license', 'insured', 'background'],
    blurb: 'Whole-home rewiring, changeover switches, inverter and solar hookups, and fast fault finding.',
    fee: 15, licence: 'Lic #GH-EL-51733',
  },
  {
    id: 3, name: 'Yaw Asante', trade: 'carpentry', role: 'Bespoke Carpentry & Cabinetry',
    rate: 110, rating: 4.88, reviews: 96, years: 16, onTime: 97, city: 'Kumasi',
    areas: ['Adum', 'Nhyiaeso', 'Ahodwo', 'Santasi'],
    badges: ['Custom Furniture', 'Finish Carpenter'], available: ['week'],
    availableText: 'Flexible Scheduling', certs: ['insured', 'background'],
    blurb: 'Fine woodwork, built-in wardrobes, floating shelves and interior doors made to measure.',
    fee: 10, licence: 'Guild Member',
  },
  {
    id: 4, name: 'Cool Air Solutions', role: 'AC Installation & Repair', trade: 'hvac',
    rate: 180, rating: 4.9, reviews: 154, years: 9, onTime: 98, city: 'Accra',
    areas: ['All Greater Accra'], contact: 'Lead: Ray Mensah',
    badges: ['Eco-Certified', 'Same-Day Response'], available: ['today', 'week'],
    availableText: '2 Dispatch Teams Open', certs: ['license', 'insured', 'emergency'],
    blurb: 'Split-unit specialists: gas refills, leak checks, servicing and clean new installations.',
    fee: 20, licence: 'Reg. #GH-AC-2210',
  },
  {
    id: 5, name: 'Ama Serwaa', trade: 'cleaning', role: 'Deep Cleaning & Move-out Turnover',
    rate: 80, rating: 4.92, reviews: 310, years: 7, onTime: 99, city: 'Accra',
    areas: ['Osu', 'Labone', 'Airport Residential', 'Cantonments'],
    badges: ['Pet-Safe', 'Bonded & Insured'], available: ['today', 'week', 'weekend'],
    availableText: 'Open Weekend Slots', certs: ['insured', 'background'],
    blurb: 'Hospital-grade deep cleans, move-in and move-out turnovers, and regular home cleaning.',
    fee: 10, licence: 'Bonded',
  },
  {
    id: 6, name: 'SafeGuard Access', trade: 'security', role: 'CCTV, Locks & Gate Systems',
    rate: 140, rating: 4.85, reviews: 88, years: 11, onTime: 96, city: 'Accra',
    areas: ['Accra', 'Tema', 'Kasoa'],
    badges: ['Lock Specialist', '30 min Response'], available: ['today', 'week', 'weekend'],
    availableText: 'On-Call Urgent', certs: ['license', 'insured', 'emergency', 'background'],
    blurb: 'Emergency lockouts, gate motors, alarm systems and CCTV supplied and installed.',
    fee: 15, licence: 'Lic #GH-SEC-7741',
  },
  {
    id: 7, name: 'Nana Kwesi', trade: 'painting', role: 'Interior & Exterior Painting',
    rate: 90, rating: 4.8, reviews: 73, years: 10, onTime: 95, city: 'Accra',
    areas: ['Spintex', 'East Legon', 'Tema'],
    badges: ['Neat Finish', 'Free Quote'], available: ['week', 'weekend'],
    availableText: 'Booking Next Week', certs: ['insured'],
    blurb: 'Clean, well-prepared painting for apartments and houses, with furniture protected throughout.',
    fee: 10, licence: 'Insured',
  },
  {
    id: 8, name: 'Adjoa Mensah', trade: 'handyman', role: 'Handyman & General Repairs',
    rate: 70, rating: 4.7, reviews: 201, years: 8, onTime: 94, city: 'Accra',
    areas: ['Osu', 'Labone', 'Dzorwulu', 'Airport Residential'],
    badges: ['Quick Fixes', 'Flat Pricing'], available: ['today', 'week'],
    availableText: 'Available Today', certs: ['background'],
    blurb: 'Shelves, handles, small wall repairs, furniture assembly and all the little jobs in between.',
    fee: 10, licence: 'Background Checked',
  },
  {
    id: 9, name: 'Chef Selasi', trade: 'chef', role: 'Private Chef & Meal Prep',
    rate: 200, rating: 4.9, reviews: 64, years: 9, onTime: 98, city: 'Accra',
    areas: ['Cantonments', 'East Legon', 'Airport Residential'],
    badges: ['Local & Continental', 'Food Safety Trained'], available: ['week', 'weekend'],
    availableText: 'Weekends Open', certs: ['background'],
    blurb: 'Home dinners, family meal prep and event catering, cooked fresh in your own kitchen.',
    fee: 15, licence: 'Food Safety Certified',
  },
  {
    id: 10, name: 'Kojo Drives', trade: 'driver', role: 'Chauffeur & Moving Help',
    rate: 100, rating: 4.75, reviews: 119, years: 6, onTime: 97, city: 'Accra',
    areas: ['Accra', 'Tema', 'Kasoa'],
    badges: ['Licensed Driver', 'Moving Crew'], available: ['today', 'week', 'weekend'],
    availableText: 'Available Today', certs: ['license', 'insured', 'background'],
    blurb: 'Reliable hourly driver and moving-day help with a covered truck for furniture.',
    fee: 10, licence: 'Licensed Driver',
  },
  {
    id: 11, name: 'Bright Appliances', trade: 'appliances', role: 'Fridge, Washer & Cooker Repair',
    rate: 130, rating: 4.82, reviews: 167, years: 12, onTime: 96, city: 'Kumasi',
    areas: ['Adum', 'Ahodwo', 'Kwadaso'],
    badges: ['Genuine Parts', '90-day Repair Warranty'], available: ['today', 'week'],
    availableText: 'Available Today', certs: ['license', 'insured'],
    blurb: 'Same-day repairs for fridges, washing machines, cookers and microwaves.',
    fee: 15, licence: 'Reg. #GH-AP-3308',
  },
  {
    id: 12, name: 'Takoradi Plumbing Co.', trade: 'plumbing', role: 'Plumbers & Borehole Fitters',
    rate: 100, rating: 4.6, reviews: 52, years: 8, onTime: 93, city: 'Takoradi',
    areas: ['Beach Road', 'Market Circle', 'Anaji'],
    badges: ['Borehole Pumps', 'Water Tanks'], available: ['week', 'weekend'],
    availableText: 'Flexible Scheduling', certs: ['insured', 'background'],
    blurb: 'Pipework, water tank installs and borehole pump repairs across Takoradi.',
    fee: 10, licence: 'Insured',
  },
]
