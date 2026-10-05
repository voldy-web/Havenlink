// Creates (or updates) an admin account. There is no sign-up form for admins, on purpose.
// Run it from the server folder, giving the details in environment variables, for example (PowerShell):
//   $env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_NAME="Your Name"; $env:ADMIN_PASSWORD="a long password"; npm run create-admin
// It uses DATABASE_URL, so to make an admin on the live site, point DATABASE_URL at the live
// database for that one command. Never save the address or the password in a file.
import bcrypt from 'bcryptjs'
import { pathToFileURL } from 'node:url'
import { pool } from './pool.js'
import { checkEmail, checkName, checkNewPassword, clean } from '../utils/validate.js'

export async function createAdmin({ email, name, password }) {
  const problem = checkEmail(email) || checkName(name) || checkNewPassword(password)
  if (problem) throw new Error(problem)
  const hash = await bcrypt.hash(password, 12)
  const { rows } = await pool.query(
    `insert into users (name, email, phone, role, password_hash) values ($1, $2, 'n/a', 'admin', $3)
     on conflict (lower(email)) do update set role = 'admin', name = excluded.name, password_hash = excluded.password_hash,
       password_changed_at = date_trunc('second', now())
     returning id, email`,
    [clean.text(name), clean.email(email), hash],
  )
  return rows[0]
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const admin = await createAdmin({ email: process.env.ADMIN_EMAIL, name: process.env.ADMIN_NAME, password: process.env.ADMIN_PASSWORD })
    console.log(`Admin account ready: ${admin.email}`)
  } catch (err) {
    console.error(err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}
