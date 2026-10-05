// Loads the starter homes and products (server/seed/*.json) into the database.
// It runs every time the server starts. Rows with source 'seed' are inserted or
// updated to match the files, and starter rows that were removed from the files
// are deleted. Rows created by owners or vendors are never touched.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { withTransaction } from './tx.js'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'seed')
const read = async (name) => JSON.parse(await readFile(path.join(dir, name), 'utf8'))

export async function seedCatalog() {
  const [homes, goods] = await Promise.all([read('properties.json'), read('products.json')])
  await withTransaction(async (db) => {
    for (const p of homes) {
      await db.query(
        `insert into properties (id, source, listing_type, property_type, city, price, featured, data)
         values ($1, 'seed', $2, $3, $4, $5, $6, $7)
         on conflict (id) do update set listing_type = excluded.listing_type, property_type = excluded.property_type,
           city = excluded.city, price = excluded.price, featured = excluded.featured, data = excluded.data, updated_at = now()
         where properties.source = 'seed'`,
        [p.id, p.listingType, p.propertyType, p.city, p.price, Boolean(p.featured), p],
      )
    }
    await db.query("delete from properties where source = 'seed' and not (id = any($1))", [homes.map((p) => p.id)])

    for (const p of goods) {
      await db.query(
        `insert into products (id, source, category, name, price, stock, data)
         values ($1, 'seed', $2, $3, $4, $5, $6)
         on conflict (id) do update set category = excluded.category, name = excluded.name, price = excluded.price,
           stock = excluded.stock, data = excluded.data, updated_at = now()
         where products.source = 'seed'`,
        [p.id, p.category, p.name, p.price, p.stock ?? 0, p],
      )
    }
    await db.query("delete from products where source = 'seed' and not (id = any($1))", [goods.map((p) => p.id)])
  })
  return { properties: homes.length, products: goods.length }
}

// "npm run seed": run it by hand.
import { pathToFileURL } from 'node:url'
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { pool } = await import('./pool.js')
  try {
    console.log('Catalog loaded:', await seedCatalog())
  } finally {
    await pool.end()
  }
}
