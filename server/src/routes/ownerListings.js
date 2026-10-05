// Homes posted by the signed-in owner. Every query is limited to the caller's own
// listings (owner_id = req.user.id). New and edited listings wait for an admin to approve them.
import { Router } from 'express'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/tx.js'
import { HttpError, failIfInvalid } from '../utils/errors.js'
import { isInt, isText } from '../utils/validate.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth, requireRole('owner'))

const FEATURES = ['ac', 'parking', 'pets', 'generator', 'water', 'security', 'pool', 'fiber', 'balcony']
const TYPES = ['apartment', 'house', 'townhouse', 'studio']
const AVAILABLE = ['now', 'month', 'flexible']
const MAX_LISTINGS = 30
const MAX_PHOTOS = 10
const PHOTO_KEY = /^upload:(\d{1,10})$/

const num = (v) => typeof v === 'number' && Number.isFinite(v)

// The listing as the owner sees it, including its review status.
const mine = (r) => ({
  id: r.id, reviewStatus: r.review_status, reviewNote: r.review_note, updatedAt: r.updated_at, createdAt: r.created_at,
  listing: r.data,
})

// Checks the form and builds the "data" the public pages show. Only known fields are kept.
async function build(b, user, db) {
  const photos = Array.isArray(b.photos) ? b.photos : []
  const ids = photos.map((k) => PHOTO_KEY.exec(typeof k === 'string' ? k : '')?.[1]).filter(Boolean).map(Number)
  const owned = ids.length ? (await db.query('select id::int from images where id = any($1) and owner_id = $2', [ids, user.id])).rows.length : 0
  const hasCoords = b.lat !== undefined || b.lng !== undefined
  failIfInvalid({
    title: isText(b.title, 5, 100) ? null : 'Give the home a title (5 to 100 characters).',
    description: isText(b.description, 20, 2000) ? null : 'Describe the home in 20 to 2,000 characters.',
    address: isText(b.address, 5, 200) ? null : 'Enter the street address.',
    area: isText(b.area, 2, 80) ? null : 'Enter the area or neighbourhood.',
    city: isText(b.city, 2, 60) ? null : 'Enter the city.',
    listingType: ['rent', 'buy'].includes(b.listingType) ? null : 'Choose rent or buy.',
    propertyType: TYPES.includes(b.propertyType) ? null : 'Choose a property type.',
    price: num(b.price) && b.price > 0 && b.price <= 1_000_000_000 ? null : 'Enter a price above zero.',
    beds: isInt(b.beds, 0, 20) ? null : 'Enter the number of bedrooms (0 to 20).',
    baths: isInt(b.baths, 0, 20) ? null : 'Enter the number of bathrooms (0 to 20).',
    sqm: isInt(b.sqm, 5, 100_000) ? null : 'Enter the size in square metres.',
    available: AVAILABLE.includes(b.available) ? null : 'Choose when it is available.',
    features: Array.isArray(b.features) && b.features.length <= FEATURES.length && b.features.every((f) => FEATURES.includes(f)) && new Set(b.features).size === b.features.length ? null : 'Some of the features are not valid.',
    photos: photos.length >= 1 && photos.length <= MAX_PHOTOS && ids.length === photos.length && new Set(ids).size === ids.length && owned === ids.length
      ? null : `Add 1 to ${MAX_PHOTOS} photos that you uploaded.`,
    ...(hasCoords && { lat: num(b.lat) && num(b.lng) && Math.abs(b.lat) <= 90 && Math.abs(b.lng) <= 180 ? null : 'The map position is not valid.' }),
  })
  return {
    title: b.title.trim(), description: b.description.trim(), address: b.address.trim(), area: b.area.trim(), city: b.city.trim(),
    listingType: b.listingType, propertyType: b.propertyType, price: b.price, beds: b.beds, baths: b.baths, sqm: b.sqm,
    available: b.available, features: b.features,
    image: photos[0], detailImage: photos[0], gallery: photos, photos: photos.length,
    status: 'Available', badge: 'New', label: '', highlight: '', note: '', action: 'Book Viewing',
    categories: ['New Listings'], featured: false, verified: false, agentId: null, ownerName: user.name,
    ...(hasCoords && { lat: b.lat, lng: b.lng }),
  }
}

// Photos that an old version used but the new one does not: delete them (only the owner's own).
async function dropUnused(db, userId, before, after) {
  const gone = (before ?? []).filter((k) => !(after ?? []).includes(k)).map((k) => PHOTO_KEY.exec(k)?.[1]).filter(Boolean).map(Number)
  if (gone.length) await db.query('delete from images where id = any($1) and owner_id = $2', [gone, userId])
}

async function ownListing(db, id, userId, lock = false) {
  const n = Number(id)
  if (!Number.isInteger(n) || n < 1 || n > 2_000_000_000) throw new HttpError(404, 'Listing not found.')
  const { rows } = await db.query(`select * from properties where id = $1 and owner_id = $2 and source = 'owner'${lock ? ' for update' : ''}`, [n, userId])
  if (!rows[0]) throw new HttpError(404, 'Listing not found.')
  return rows[0]
}

router.get('/properties', async (req, res) => {
  const { rows } = await pool.query("select * from properties where owner_id = $1 and source = 'owner' order by created_at desc", [req.user.id])
  res.json({ listings: rows.map(mine) })
})

router.get('/properties/:id', async (req, res) => {
  res.json({ listing: mine(await ownListing(pool, req.params.id, req.user.id)) })
})

router.post('/properties', async (req, res) => {
  const row = await withTransaction(async (db) => {
    const count = (await db.query("select count(*)::int as n from properties where owner_id = $1 and source = 'owner'", [req.user.id])).rows[0].n
    if (count >= MAX_LISTINGS) throw new HttpError(400, 'You have reached the limit of listings.')
    const data = await build(req.body ?? {}, req.user, db)
    return (await db.query(
      `insert into properties (source, owner_id, review_status, listing_type, property_type, city, price, featured, data)
       values ('owner', $1, 'pending', $2, $3, $4, $5, false, $6) returning *`,
      [req.user.id, data.listingType, data.propertyType, data.city, data.price, data],
    )).rows[0]
  })
  res.status(201).json({ listing: mine(row) })
})

// Editing sends the listing back for review, so a live home cannot be swapped for something else unchecked.
router.put('/properties/:id', async (req, res) => {
  const row = await withTransaction(async (db) => {
    const old = await ownListing(db, req.params.id, req.user.id, true)
    const data = await build(req.body ?? {}, req.user, db)
    await dropUnused(db, req.user.id, old.data.gallery, data.gallery)
    return (await db.query(
      `update properties set review_status = 'pending', review_note = '', reviewed_by = null, reviewed_at = null,
         listing_type = $2, property_type = $3, city = $4, price = $5, data = $6, updated_at = now()
       where id = $1 returning *`,
      [old.id, data.listingType, data.propertyType, data.city, data.price, data],
    )).rows[0]
  })
  res.json({ listing: mine(row) })
})

// Pause hides a live home; resume shows it again (it was already approved).
for (const [action, from, to] of [['pause', 'approved', 'paused'], ['resume', 'paused', 'approved']]) {
  router.post(`/properties/:id/${action}`, async (req, res) => {
    const row = await withTransaction(async (db) => {
      const found = await ownListing(db, req.params.id, req.user.id, true)
      if (found.review_status !== from) throw new HttpError(409, `Only a ${from} listing can be ${action}d.`)
      return (await db.query('update properties set review_status = $2, updated_at = now() where id = $1 returning *', [found.id, to])).rows[0]
    })
    res.json({ listing: mine(row) })
  })
}

router.delete('/properties/:id', async (req, res) => {
  await withTransaction(async (db) => {
    const found = await ownListing(db, req.params.id, req.user.id, true)
    await db.query('delete from properties where id = $1', [found.id])
    await dropUnused(db, req.user.id, found.data.gallery, [])
  })
  res.status(204).end()
})

export default router
