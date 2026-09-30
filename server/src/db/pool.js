import pg from 'pg'
import { config } from '../config.js'

// One shared pool of database connections for the whole server.
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
})

// A dropped idle connection should not crash the server.
pool.on('error', (err) => console.error('Database connection error:', err.message))
