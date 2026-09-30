import { comforts } from '../data/propertyOptions'
import { amenityGroups, sharedGallery, nearbyByCity } from '../data/propertyDetails'
import { formatPrice } from './format'

const typeNames = {
  apartment: 'apartment',
  house: 'house',
  townhouse: 'townhouse',
  studio: 'studio',
}

// Builds the text and lists shown on the detail page from a listing's
// basic fields. When the backend exists, owners will write this text
// themselves and this helper can be removed.
export function buildDetails(p) {
  const type = typeNames[p.propertyType] || 'home'
  const forRent = p.listingType === 'rent'

  const description = [
    `${p.title} is a ${p.beds}-bedroom ${type} in ${p.area}, ${p.city}. ` +
      `With ${p.baths} ${p.baths === 1 ? 'bathroom' : 'bathrooms'} and ${p.sqm} sq m of living space, ` +
      (p.status === 'Available'
        ? 'it is ready for you to view.'
        : 'it is currently reserved. You can still book a viewing or join the waitlist.'),
    `The neighbourhood is well connected, with shops, transport and daily services close by. ` +
      `${forRent ? 'Book a viewing to see the home in person, or chat with the owner to ask about the terms.' : 'Book a viewing to see the home in person, or chat with the owner to ask about the sale.'}`,
  ]

  const labelOf = (id) => comforts.find((c) => c.id === id)?.label
  const highlights = p.features.map(labelOf).filter(Boolean)

  const groups = amenityGroups
    .map((g) => ({
      title: g.title,
      items: g.ids.filter((id) => p.features.includes(id)).map(labelOf),
    }))
    .filter((g) => g.items.length > 0)

  const terms = forRent
    ? [
        { icon: 'calendar', title: 'Lease Duration', value: '12-Month Minimum', text: 'Flexible renewal is possible after the first year.' },
        { icon: 'shield', title: 'Security Deposit', value: `${formatPrice(p.price)} (1 Month)`, text: 'Refundable at the end of the tenancy, subject to inspection.' },
        { icon: 'home', title: 'Pets', value: p.features.includes('pets') ? 'Pets Welcome' : 'Ask the Owner', text: p.features.includes('pets') ? 'Cats and dogs are welcome.' : 'Pet rules are set by the owner.' },
      ]
    : [
        { icon: 'home', title: 'Property', value: `${p.beds} Bed ${type}`, text: `${p.sqm} sq m in ${p.area}, ${p.city}.` },
        { icon: 'shield', title: 'Ownership', value: 'Documents Verified', text: 'Ask the owner for the title documents at your viewing.' },
        { icon: 'calendar', title: 'Handover', value: p.available === 'now' ? 'Immediate' : 'To Be Agreed', text: 'The move-in date is agreed with the owner.' },
      ]

  // Every listing gets its own main photo plus four interior photos. The
  // mix rotates by listing so pages do not all look the same, and homes
  // with a pool always show the pool photo first.
  const rotated = [...sharedGallery.slice(p.id % sharedGallery.length), ...sharedGallery.slice(0, p.id % sharedGallery.length)]
  const pool = rotated.find((x) => x.kind === 'pool')
  const extras = p.features.includes('pool') && pool ? [pool, ...rotated.filter((x) => x !== pool)] : rotated
  const gallery = [
    { src: p.detailImage || p.image, caption: p.title },
    ...extras.filter((x) => x.src !== (p.detailImage || p.image)).slice(0, 4),
  ]

  return {
    description,
    highlights,
    groups,
    terms,
    gallery,
    nearby: nearbyByCity[p.city] || [],
  }
}
