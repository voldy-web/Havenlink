import { photo } from './photos'

// Extra content for the property detail page.

// Interior photos shared by every listing until real photos are uploaded.
// Each listing shows a different mix (see utils/propertyDetails.js).
export const sharedGallery = [
  { src: photo('detail-kitchen'), caption: 'Kitchen' },
  { src: photo('detail-bedroom'), caption: 'Main bedroom' },
  { src: photo('detail-bath'), caption: 'Bathroom' },
  { src: photo('detail-pool'), caption: 'Pool & grounds', kind: 'pool' },
  { src: photo('home-grey-kitchen'), caption: 'Modern kitchen' },
  { src: photo('home-sofa-lounge'), caption: 'Lounge' },
  { src: photo('home-blue-bedroom'), caption: 'Guest bedroom' },
  { src: photo('home-dining-room'), caption: 'Dining area' },
  { src: photo('home-wardrobe-room'), caption: 'Storage & dressing' },
  { src: photo('home-hero-lounge'), caption: 'Living room' },
  { src: photo('home-garden-lounge'), caption: 'Garden lounge' },
]

// Which heading each amenity (see propertyOptions.js) is listed under.
export const amenityGroups = [
  { title: 'Interior', ids: ['ac', 'balcony', 'pets', 'fiber'] },
  { title: 'Building & Community', ids: ['security', 'pool'] },
  { title: 'Parking & Utilities', ids: ['parking', 'generator', 'water'] },
]

// Places near each city's listings. Replace with real data later.
const genericNearby = [
  { icon: 'bag', name: 'Local Market', distance: '5 min drive' },
  { icon: 'home', name: 'Main Road / Transport', distance: '3 min walk' },
  { icon: 'tool', name: 'Clinic / Hospital', distance: '10 min drive' },
]

export const nearbyByCity = {
  Tema: genericNearby,
  Kasoa: genericNearby,
  Tamale: genericNearby,
  'Cape Coast': genericNearby,
  Accra: [
    { icon: 'bag', name: 'Shopping Mall', distance: '5 min drive' },
    { icon: 'home', name: 'Local Market', distance: '3 min drive' },
    { icon: 'tool', name: 'Hospital', distance: '8 min drive' },
  ],
  Kumasi: [
    { icon: 'bag', name: 'Kejetia Market', distance: '6 min drive' },
    { icon: 'home', name: 'Central Bus Station', distance: '10 min drive' },
    { icon: 'tool', name: 'Hospital', distance: '9 min drive' },
  ],
  Takoradi: [
    { icon: 'bag', name: 'Market Circle', distance: '7 min drive' },
    { icon: 'home', name: 'Beach', distance: '4 min walk' },
    { icon: 'tool', name: 'Hospital', distance: '10 min drive' },
  ],
}
