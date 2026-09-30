// Shared test setup: points the server at the TEST database and starts it on
// a random free port. Tests then call the API like a browser would.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://havenlink:havenlink_dev_pw@localhost:5432/havenlink_test'
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-the-server-to-start'
process.env.CLIENT_ORIGIN = 'http://localhost:5173'
process.env.AUTH_RATE_LIMIT = '1000'

const { createApp } = await import('../src/app.js')
const { pool } = await import('../src/db/pool.js')
const { runMigrations } = await import('../src/db/migrate.js')

export { pool }

export async function startServer() {
  await runMigrations(pool)
  await pool.query('truncate users cascade')
  const server = createApp().listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  return {
    base,
    async close() {
      await new Promise((resolve) => server.close(resolve))
      await pool.end()
    },
  }
}

export const person = (over = {}) => ({
  name: 'Ama Mensah', email: 'ama@example.com', phone: '0241234567', role: 'resident', password: 'a-good-password', ...over,
})

// Small helper: call the API and return { status, body, headers }.
export async function call(base, path, { method = 'GET', body, token, headers = {} } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body !== undefined && { 'content-type': 'application/json' }),
      ...(token && { authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* not JSON */ }
  return { status: res.status, body: json, headers: res.headers }
}
