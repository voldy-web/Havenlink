// Photo upload for owners (and later vendors), and public photo files.
// The website shrinks each photo before sending it, and the server checks that
// the bytes really are a JPEG, PNG or WebP picture and are small enough.
import { Router } from 'express'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { config } from '../config.js'
import { pool } from '../db/pool.js'
import { HttpError } from '../utils/errors.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
const MAX_BYTES = 700_000
const MAX_PER_PERSON = 300
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/

// The first bytes of a real picture file.
const looksLike = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) => b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.uploadRateLimit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many uploads. Please wait a few minutes and try again.' },
})

router.post('/', express.json({ limit: '1mb' }), limiter, requireAuth, requireRole('owner', 'vendor'), async (req, res) => {
  const match = DATA_URL.exec(typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '')
  if (!match) throw new HttpError(400, 'Please upload a JPEG, PNG or WebP photo.')
  const bytes = Buffer.from(match[2], 'base64')
  if (bytes.length > MAX_BYTES) throw new HttpError(400, 'That photo is too large. Please choose a smaller one.')
  if (!looksLike[match[1]](bytes)) throw new HttpError(400, 'That file is not a valid photo.')

  const count = (await pool.query('select count(*)::int as n from images where owner_id = $1', [req.user.id])).rows[0].n
  if (count >= MAX_PER_PERSON) throw new HttpError(400, 'You have reached the photo limit.')
  const { rows } = await pool.query('insert into images (owner_id, content_type, bytes) values ($1, $2, $3) returning id::int', [req.user.id, match[1], bytes])
  res.status(201).json({ image: { id: rows[0].id, key: `upload:${rows[0].id}` } })
})

// Anyone can view a photo (listings are public). Photos never change, so browsers may keep them.
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1 || id > 2_000_000_000) throw new HttpError(404, 'Not found.')
  const { rows } = await pool.query('select content_type, bytes from images where id = $1', [id])
  if (!rows[0]) throw new HttpError(404, 'Not found.')
  res.set({
    'Content-Type': rows[0].content_type,
    'Cache-Control': 'public, max-age=31536000, immutable',
    // The website is on a different address from this server, so it must be allowed to show these pictures.
    'Cross-Origin-Resource-Policy': 'cross-origin',
  })
  res.send(rows[0].bytes)
})

export default router
