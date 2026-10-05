// Checks a "Sign in with Google" token (an ID token) without trusting the browser: the signature is
// verified against Google's published public keys, and the token must be for THIS site (audience),
// issued by Google, unexpired, and for an email address Google has verified.
import { createPublicKey } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { HttpError } from './errors.js'

const ISSUERS = ['https://accounts.google.com', 'accounts.google.com']
let cache = { keys: new Map(), fetchedAt: 0 }

async function loadKeys() {
  const res = await fetch(config.googleCertsUrl)
  if (!res.ok) throw new HttpError(502, 'Could not reach Google to check your sign-in. Please try again.')
  const { keys } = await res.json()
  cache = { keys: new Map(keys.map((k) => [k.kid, createPublicKey({ key: k, format: 'jwk' })])), fetchedAt: Date.now() }
}

async function keyFor(kid) {
  const age = Date.now() - cache.fetchedAt
  if (!cache.keys.has(kid) && age > 60_000) await loadKeys() // unknown key: Google may have rotated them
  else if (age > 3600_000) await loadKeys()
  return cache.keys.get(kid)
}

export async function verifyGoogleToken(credential) {
  const bad = new HttpError(401, 'We could not verify your Google sign-in. Please try again.')
  if (typeof credential !== 'string' || credential.length > 4000) throw bad
  const decoded = jwt.decode(credential, { complete: true })
  if (!decoded?.header?.kid || decoded.header.alg !== 'RS256') throw bad
  const key = await keyFor(decoded.header.kid)
  if (!key) throw bad
  let p
  try {
    p = jwt.verify(credential, key, { algorithms: ['RS256'], audience: config.googleClientId, issuer: ISSUERS })
  } catch {
    throw bad
  }
  if (typeof p.sub !== 'string' || typeof p.email !== 'string') throw bad
  if (p.email_verified !== true && p.email_verified !== 'true') throw new HttpError(403, 'Google says this email address is not verified, so we cannot use it.')
  return { sub: p.sub, email: p.email, name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : p.email.split('@')[0] }
}
