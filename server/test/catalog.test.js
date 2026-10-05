import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, call, pool } from './helpers.js'
import { seedCatalog } from '../src/db/seedCatalog.js'

let api
before(async () => { api = await startServer() })
after(() => api.close())
const get = (path) => call(api.base, path)

test('homes and products are public and come from the database', async () => {
  const homes = await get('/api/properties')
  assert.equal(homes.status, 200)
  assert.equal(homes.body.properties.length, 65)
  const first = homes.body.properties[0]
  assert.equal(typeof first.id, 'number')
  assert.equal(typeof first.price, 'number')
  assert.ok(first.title && first.image && first.listingType)
  const goods = await get('/api/products')
  assert.equal(goods.body.products.length, 52)
  assert.ok(goods.body.products.every((p) => p.image && typeof p.price === 'number' && Number.isInteger(p.stock)))
  assert.match(homes.headers.get('cache-control'), /no-cache/)
})

test('one home or product by id, 404 for unknown or invalid ids', async () => {
  assert.equal((await get('/api/properties/1')).body.property.id, 1)
  const sofa = (await get('/api/products/2')).body.product
  assert.equal(sofa.price, 3900)
  assert.equal(sofa.options[1].choices[1].extra, 550)
  assert.deepEqual(sofa.gallery, ['sofa-main', 'sofa-2', 'sofa-3', 'sofa-4']) // photos are keys, not file paths
  for (const id of ['999999', '0', '-1', 'abc', '1.5', '99999999999']) {
    assert.equal((await get(`/api/properties/${id}`)).status, 404, id)
    assert.equal((await get(`/api/products/${id}`)).status, 404, id)
  }
})

test('unapproved homes and unpublished products are hidden', async () => {
  await pool.query("update properties set review_status = 'paused' where id = 2")
  await pool.query('update products set published = false where id = 3')
  assert.equal((await get('/api/properties/2')).status, 404)
  assert.equal((await get('/api/products/3')).status, 404)
  assert.ok(!(await get('/api/properties')).body.properties.some((p) => p.id === 2))
  assert.ok(!(await get('/api/products')).body.products.some((p) => p.id === 3))
  await pool.query("update properties set review_status = 'approved' where id = 2")
  await pool.query('update products set published = true where id = 3')
})

test('seeding again is safe: it fixes starter rows, keeps owner rows, drops removed starter rows', async () => {
  await pool.query("update products set price = 1, name = 'Changed' where id = 4")
  const { rows } = await pool.query(
    `insert into products (source, category, name, price, stock, data) values ('owner', 'small', 'Owner item', 50, 3, '{"name":"Owner item"}') returning id`,
  )
  await pool.query(
    `insert into products (id, source, category, name, price, stock, data) values (900, 'seed', 'small', 'Old starter', 5, 1, '{}')`,
  )
  await seedCatalog()
  const sofa = (await pool.query('select name, price from products where id = 4')).rows[0]
  assert.notEqual(sofa.name, 'Changed')
  assert.ok(sofa.price > 1)
  assert.equal((await pool.query('select count(*)::int as n from products where id = $1', [rows[0].id])).rows[0].n, 1)
  assert.ok(rows[0].id >= 1000) // new rows count up from 1000
  assert.equal((await pool.query('select count(*)::int as n from products where id = 900')).rows[0].n, 0)
  await pool.query('delete from products where id = $1', [rows[0].id])
})
