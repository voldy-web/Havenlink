// Applies the .sql files in db/migrations in order, once each. Safe to run
// many times. Run it with: npm run migrate (the server also runs it on start).
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')

export async function runMigrations(pool) {
  const client = await pool.connect()
  try {
    // The lock makes two servers starting at once take turns instead of clashing.
    await client.query('select pg_advisory_lock(727274)')
    await client.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())')
    const done = new Set((await client.query('select name from schema_migrations')).rows.map((r) => r.name))
    const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()
    for (const file of files) {
      if (done.has(file)) continue
      const sql = await readFile(path.join(dir, file), 'utf8')
      try {
        await client.query('begin')
        await client.query(sql)
        await client.query('insert into schema_migrations (name) values ($1)', [file])
        await client.query('commit')
        console.log(`Applied migration ${file}`)
      } catch (err) {
        await client.query('rollback')
        throw new Error(`Migration ${file} failed: ${err.message}`, { cause: err })
      }
    }
  } finally {
    await client.query('select pg_advisory_unlock(727274)').catch(() => {})
    client.release()
  }
}

// Running "node src/db/migrate.js" directly.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { pool } = await import('./pool.js')
  try {
    await runMigrations(pool)
    console.log('Database is up to date.')
  } catch (err) {
    console.error(err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}
