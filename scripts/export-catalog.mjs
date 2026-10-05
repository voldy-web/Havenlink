// Writes the starter homes and shop products to server/seed/*.json so the
// server can load them into the database. Run it with: node scripts/export-catalog.mjs
// Photos are written as KEYS (the file name without its extension, for example
// "appliance-015"); the website turns a key back into the real picture.
import { createServer } from 'vite'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })

// "/src/assets/photos/appliance-015.jpg" -> "appliance-015"
const IMAGE = /\.(jpe?g|png|webp)(\?.*)?$/i
const toKey = (value) => path.basename(value).replace(IMAGE, '')
const convert = (value) => {
  if (typeof value === 'string' && IMAGE.test(value)) return toKey(value)
  if (Array.isArray(value)) return value.map(convert)
  return value
}

function clean(item, imageFields) {
  const copy = { ...item }
  for (const field of imageFields) if (copy[field] !== undefined) copy[field] = convert(copy[field])
  return copy
}

try {
  const { properties } = await vite.ssrLoadModule('/src/data/properties.js')
  const { products } = await vite.ssrLoadModule('/src/data/products.js')
  const homes = properties.map((p) => clean(p, ['image', 'detailImage', 'gallery']))
  const goods = products.map((p) => clean(p, ['image', 'gallery']))

  // Safety check: no leftover file paths or URLs in the data.
  for (const [name, list] of [['properties', homes], ['products', goods]]) {
    const bad = JSON.stringify(list).match(/"[^"]*\/(src|assets)\/[^"]*"/g)
    if (bad) throw new Error(`${name}: found file paths in the data: ${bad.slice(0, 3).join(', ')}`)
  }

  await writeFile(path.join(root, 'server/seed/properties.json'), `${JSON.stringify(homes, null, 1)}\n`)
  await writeFile(path.join(root, 'server/seed/products.json'), `${JSON.stringify(goods, null, 1)}\n`)
  console.log(`Wrote ${homes.length} properties and ${goods.length} products to server/seed/`)
} finally {
  await vite.close()
}
