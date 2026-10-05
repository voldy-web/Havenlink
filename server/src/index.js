import { config } from './config.js'
import { pool } from './db/pool.js'
import { runMigrations } from './db/migrate.js'
import { seedCatalog } from './db/seedCatalog.js'
import { createApp } from './app.js'

// Make sure the database tables exist and the starter homes and products are loaded, then start listening.
await runMigrations(pool)
console.log('Catalog ready:', await seedCatalog())
// A short status line in the logs, so it is easy to see (for example in Render's Logs tab) what is switched on.
console.log(`Email: ${config.brevoApiKey ? 'Brevo' : config.resendApiKey ? 'Resend' : 'NOT set up (no emails will be sent)'} | Google sign-in: ${config.googleClientId ? 'on' : 'off'} | Links in emails point to ${config.appUrl}`)
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
