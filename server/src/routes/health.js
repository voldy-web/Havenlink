import { Router } from 'express'
import { pool } from '../db/pool.js'

const router = Router()

// Cheap check that the server is running (use this for Render's health check).
router.get('/', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// Also checks the database connection.
router.get('/db', async (_req, res) => {
  try {
    await pool.query('select 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable' })
  }
})

export default router
