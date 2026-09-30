import pg from 'pg'
import { config } from '../config.js'

// Dates come back as plain "2026-10-05" text (not shifted by timezones) and
// money columns as real numbers instead of text.
pg.types.setTypeParser(1082, (value) => value)
pg.types.setTypeParser(1700, (value) => parseFloat(value))

// One shared pool of database connections for the whole server.
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
})

// A dropped idle connection should not crash the server.
pool.on('error', (err) => console.error('Database connection error:', err.message))
