// Where the website gets its homes and shop products from.
//  - With the real API (VITE_API_URL set): they are loaded from the server's database once per visit.
//  - In demo mode, or if the server cannot be reached: the sample data bundled with the site.
// Pictures come from the server as KEYS (for example "appliance-015") that this file
// turns into real picture addresses. A full web address (an uploaded photo) is used as it is.
import { api, apiEnabled, uploadedPhotoUrl } from './api'
import { properties as sampleProperties } from '../data/properties'
import { products as sampleProducts } from '../data/products'
import { photo } from '../data/photos'

// A picture value is a key ("appliance-015"), an uploaded photo ("upload:12") or a full web address.
export function picture(value) {
  if (typeof value !== 'string') return undefined
  if (/^https?:\/\//.test(value)) return value
  const uploaded = /^upload:(\d+)$/.exec(value)
  return uploaded ? uploadedPhotoUrl(uploaded[1]) : photo(value)
}

function withPictures(item, fields) {
  const copy = { ...item }
  for (const field of fields) {
    if (Array.isArray(copy[field])) copy[field] = copy[field].map(picture).filter(Boolean)
    else if (copy[field]) copy[field] = picture(copy[field])
  }
  return copy
}

// Loads a list once and remembers it. If the server fails, the sample data is used
// and nothing is remembered, so the next visit to the page tries the server again.
function loader(path, key, fields, sample, keep) {
  let cached = null
  return () => {
    if (!apiEnabled) return Promise.resolve(sample)
    cached ??= api(path).then((res) => {
      if (!res.ok) {
        cached = null
        return sample
      }
      return res.data[key].map((item) => withPictures(item, fields)).filter(keep)
    })
    return cached
  }
}

export const loadProperties = loader('/properties', 'properties', ['image', 'detailImage', 'gallery'], sampleProperties, (p) => p.image)
// A shop product is listed only when it has a picture.
export const loadProducts = loader('/products', 'products', ['image', 'gallery'], sampleProducts, (p) => p.image)
