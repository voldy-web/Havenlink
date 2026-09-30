import { config } from './config.js'
import { pool } from './db/pool.js'
import { runMigrations } from './db/migrate.js'
import { createApp } from './app.js'

// Make sure the database tables exist, then start listening.
await runMigrations(pool)
const server = createApp().listen(config.port, () => {
  console.log(`Haven Link API listening on port ${config.port}`)
})

// Finish current requests and close the database when the host stops us.
function shutdown() {
  server.close(() => pool.end().then(() => process.exit(0)))
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
