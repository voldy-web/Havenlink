import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config.js'
import { HttpError } from './utils/errors.js'
import health from './routes/health.js'
import auth from './routes/auth.js'
import saved from './routes/saved.js'
import viewings from './routes/viewings.js'
import reports from './routes/reports.js'
import orders from './routes/orders.js'
import serviceRequests from './routes/serviceRequests.js'

// The Express app (kept separate from index.js so tests can start it).
export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  // Render sits behind a proxy; this makes rate limiting see the real visitor IP.
  if (config.isProduction) app.set('trust proxy', 1)

  app.use(helmet())
  app.use(cors({
    origin(origin, done) {
      // No Origin header = not a browser (curl, health checks): allow.
      done(null, !origin || config.clientOrigins.includes(origin))
    },
  }))

  // Reports accept photos, so they read their own (bigger) request body first.
  app.use('/api/reports', reports)
  app.use(express.json({ limit: '100kb' }))

  app.use('/api/health', health)
  app.use('/api/auth', auth)
  app.use('/api/saved', saved)
  app.use('/api/viewings', viewings)
  app.use('/api/orders', orders)
  app.use('/api/service-requests', serviceRequests)

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found.')))

  // Every error ends up here. Expected errors show their message; anything
  // else is logged and shown as a plain "something went wrong".
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' })
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' })
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...(err.fields && { fields: err.fields }) })
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  })

  return app
}
