// Public, read-only lists of homes and shop products (no sign-in needed, like browsing the site).
import { Router } from 'express'
import { pool } from '../db/pool.js'
import { HttpError } from '../utils/errors.js'

const router = Router()

// Browsers may keep a copy but must check it is still fresh each time (a quick check that
// sends nothing new when the lists have not changed), so an approved home shows up straight away.
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-cache')
  next()
})

// The full details live in the "data" column; the id and price come from the real columns.
const home = (r) => ({ ...r.data, id: r.id, price: r.price })
const product = (r) => ({ ...r.data, id: r.id, price: r.price, stock: r.stock })

const asId = (value) => {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1 || id > 2_000_000_000) throw new HttpError(404, 'Not found.')
  return id
}

// Newest owner homes come first, then the starter homes in their usual order.
router.get('/properties', async (_req, res) => {
  const { rows } = await pool.query(
    `select id, price, data from properties where review_status = 'approved'
     order by (source = 'owner') desc, case when source = 'owner' then -id else id end`,
  )
  res.json({ properties: rows.map(home) })
})

router.get('/properties/:id', async (req, res) => {
  const { rows } = await pool.query("select id, price, data from properties where id = $1 and review_status = 'approved'", [asId(req.params.id)])
  if (!rows[0]) throw new HttpError(404, 'Home not found.')
  res.json({ property: home(rows[0]) })
})

router.get('/products', async (_req, res) => {
  const { rows } = await pool.query('select id, price, stock, data from products where published order by id')
  res.json({ products: rows.map(product) })
})

router.get('/products/:id', async (req, res) => {
  const { rows } = await pool.query('select id, price, stock, data from products where id = $1 and published', [asId(req.params.id)])
  if (!rows[0]) throw new HttpError(404, 'Product not found.')
  res.json({ product: product(rows[0]) })
})

export default router
