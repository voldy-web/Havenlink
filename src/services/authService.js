// Sign-up and sign-in. Two modes, chosen by services/api.js:
//  - API mode (VITE_API_URL is set): real accounts on the backend.
//  - Demo mode: accounts live in this browser (localStorage). Passwords are
//    checked for length but NEVER stored there.
import { api, apiEnabled, setToken, getToken } from './api'

const ACCOUNTS_KEY = 'havenlink_accounts'
const SESSION_KEY = 'havenlink_session'

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

const normalise = (email) => email.trim().toLowerCase()

function getDemoSessionUser() {
  const email = read(SESSION_KEY, null)
  return email ? read(ACCOUNTS_KEY, []).find((a) => a.email === email) || null : null
}

async function demoRegister({ name, email, phone, role }) {
  const accounts = read(ACCOUNTS_KEY, [])
  const clean = normalise(email)
  if (accounts.some((a) => a.email === clean)) {
    return { error: 'An account with this email already exists. Please sign in instead.' }
  }
  const account = { name: name.trim(), email: clean, phone: phone.trim(), role, createdAt: new Date().toISOString() }
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]))
    localStorage.setItem(SESSION_KEY, JSON.stringify(clean))
  } catch {
    return { error: 'Your browser blocked saving the account. Turn off private mode and try again.' }
  }
  return { user: account }
}

async function demoSignIn(email) {
  const account = read(ACCOUNTS_KEY, []).find((a) => a.email === normalise(email))
  if (!account) return { error: 'We could not find an account with that email. Create one first.' }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(account.email))
  } catch {
    return { error: 'Your browser blocked signing in. Turn off private mode and try again.' }
  }
  return { user: account }
}

function demoSignOut() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Nothing to clear if storage is blocked.
  }
}

// ---- What the rest of the site uses ----

// Who is signed in when the page loads (or null).
export async function loadSession() {
  if (!apiEnabled) return getDemoSessionUser()
  if (!getToken()) return null
  const res = await api('/auth/me', { auth: true })
  if (res.ok) return res.data.user
  if (res.status === 401) setToken(null) // expired or invalid: forget it
  return null
}

// Each returns { user } on success, or { error, fields } to show in the form.
async function viaApi(path, body) {
  const res = await api(path, { method: 'POST', body })
  if (!res.ok) return { error: res.data.error || 'Something went wrong. Please try again.', fields: res.data.fields }
  setToken(res.data.token)
  return { user: res.data.user }
}

export const registerAccount = (details) => (apiEnabled ? viaApi('/auth/register', details) : demoRegister(details))
export const signIn = (email, password) => (apiEnabled ? viaApi('/auth/login', { email, password }) : demoSignIn(email))

export function signOut() {
  if (apiEnabled) setToken(null)
  else demoSignOut()
}

export const isDemoAuth = !apiEnabled
