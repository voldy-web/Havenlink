import express, { Router } from 'express'
import { config } from '../config.js'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/tx.js'
import { HttpError, failIfInvalid } from '../utils/errors.js'
import { isText } from '../utils/validate.js'
import { insertWithRef, REF_PATTERN } from '../utils/refs.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
// Reports carry small photos, so this route accepts a bigger request than the default.
router.use(express.json({ limit: '1mb' }))
router.use(requireAuth)

const CATEGORIES = ['plumbing', 'electrical', 'hvac', 'appliances', 'structural', 'security']
const URGENCIES = ['low', 'medium', 'urgent']
const STAGES = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved']
const MAX_PHOTOS = 3
// Small pictures sent as text: "data:image/jpeg;base64,....". Up to about 190 KB each.
const PHOTO_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/

// Turns database rows into the shape the website uses (photos and history included).
export async function toReports(rows) {
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const [photos, events] = await Promise.all([
    pool.query('select report_id, image from report_photos where report_id = any($1) order by position, id', [ids]),
    pool.query('select report_id, status, note, created_at from report_events where report_id = any($1) order by created_at, id', [ids]),
  ])
  return rows.map((r) => ({
    reference: r.reference, category: r.category, urgency: r.urgency, summary: r.summary,
    description: r.description, home: r.home, status: r.status, createdAt: r.created_at,
    photos: photos.rows.filter((p) => p.report_id === r.id).map((p) => p.image),
    history: events.rows.filter((e) => e.report_id === r.id).map((e) => ({ status: e.status, at: e.created_at, note: e.note })),
  }))
}

router.get('/', async (req, res) => {
  const { rows } = await pool.query('select * from reports where user_id = $1 order by created_at desc', [req.user.id])
  res.json({ reports: await toReports(rows) })
})

router.post('/', async (req, res) => {
  const b = req.body ?? {}
  const photos = b.photos ?? []
  failIfInvalid({
    home: isText(b.home, 4, 200) ? null : 'Enter the home and unit this is about.',
    category: CATEGORIES.includes(b.category) ? null : 'Choose what is causing the issue.',
    urgency: URGENCIES.includes(b.urgency) ? null : 'Choose how urgent it is.',
    summary: isText(b.summary, 5, 90) ? null : 'Give the problem a short title (5 to 90 characters).',
    description: isText(b.description, 10, 2000) ? null : 'Describe what is happening (10 to 2000 characters).',
    photos: Array.isArray(photos) && photos.length <= MAX_PHOTOS
      && photos.every((p) => typeof p === 'string' && p.length <= 260_000 && PHOTO_PATTERN.test(p))
      ? null : `Attach up to ${MAX_PHOTOS} JPEG, PNG or WebP photos.`,
  })

  const row = await insertWithRef('R', (reference) => withTransaction(async (db) => {
    // A resident who lives in a home through HavenLink has the report sent to that home's owner.
    const tenancy = (await db.query("select id from tenancies where resident_id = $1 and status in ('Active', 'Notice given') limit 1", [req.user.id])).rows[0]
    const { rows } = await db.query(
      'insert into reports (reference, user_id, category, urgency, summary, description, home, tenancy_id) values ($1, $2, $3, $4, $5, $6, $7, $8) returning *',
      [reference, req.user.id, b.category, b.urgency, b.summary.trim(), b.description.trim(), b.home.trim(), tenancy?.id ?? null],
    )
    await db.query('insert into report_events (report_id, status) values ($1, $2)', [rows[0].id, 'Submitted'])
    for (const [position, image] of photos.entries()) {
      await db.query('insert into report_photos (report_id, position, image) values ($1, $2, $3)', [rows[0].id, position, image])
    }
    return rows[0]
  }))
  res.status(201).json({ report: (await toReports([row]))[0] })
})

// TESTING ONLY (needs DEMO_TOOLS=true): moves your own report to its next stage,
// standing in for the owner side that is not built yet.
router.patch('/:reference/advance', async (req, res) => {
  if (!config.demoTools) throw new HttpError(403, 'Not available.')
  if (!REF_PATTERN.test(req.params.reference)) throw new HttpError(404, 'Report not found.')
  const row = await withTransaction(async (db) => {
    const { rows } = await db.query('select * from reports where reference = $1 and user_id = $2 for update', [req.params.reference, req.user.id])
    if (!rows[0]) throw new HttpError(404, 'Report not found.')
    const next = STAGES[STAGES.indexOf(rows[0].status) + 1]
    if (!next) throw new HttpError(409, 'This report is already resolved.')
    const updated = await db.query('update reports set status = $1 where id = $2 returning *', [next, rows[0].id])
    await db.query('insert into report_events (report_id, status) values ($1, $2)', [rows[0].id, next])
    return updated.rows[0]
  })
  res.json({ report: (await toReports([row]))[0] })
})

export default router
