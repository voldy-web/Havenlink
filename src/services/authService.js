// Sign-up and sign-in. Two modes, chosen by services/api.js:
//  - API mode (VITE_API_URL is set): real accounts on the backend.
//  - Demo mode: accounts live in this browser (localStorage). Passwords are
//    checked for length but NEVER stored there.
import { api, apiEnabled, apiOrThrow, setToken, getToken } from './api'

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

// ---- Profile & settings ----
export const defaultPrivacy = { maskContact: true, anonymousReviews: false, residentDirectory: false }

// Saves name, phone, emergency contact and privacy choices. Returns the updated user.
export async function updateProfile(details) {
  if (apiEnabled) return (await apiOrThrow('/account/profile', { method: 'PATCH', body: details })).user
  // Demo mode: update this browser's copy of the account (never email or role).
  const email = read(SESSION_KEY, null)
  const accounts = read(ACCOUNTS_KEY, [])
  const account = { ...accounts.find((a) => a.email === email), ...details }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.map((a) => (a.email === email ? account : a))))
  return account
}

// Real accounts only. The server signs out older logins and returns a fresh token.
export async function changePassword(currentPassword, newPassword) {
  const data = await apiOrThrow('/account/password', { method: 'POST', body: { currentPassword, newPassword } })
  setToken(data.token)
  return data.user
}

// Downloads everything we hold about the account as a JSON file.
export async function exportMyData(user) {
  const data = apiEnabled ? await apiOrThrow('/account/export') : { exportedAt: new Date().toISOString(), account: user, note: 'Demo mode: data is kept in this browser only.' }
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: 'havenlink-my-data.json' })
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// Permanently deletes the account (real accounts need the password).
export async function deleteAccount(password) {
  if (apiEnabled) {
    await apiOrThrow('/account/delete', { method: 'POST', body: { password } })
    setToken(null)
    return
  }
  const email = read(SESSION_KEY, null)
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(read(ACCOUNTS_KEY, []).filter((a) => a.email !== email)))
  demoSignOut()
}

// ---- Forgotten password (real accounts only: it needs the server to send an email) ----
const NEEDS_SERVER = 'Password reset needs the live server. Demo accounts have no passwords to reset.'

export async function requestPasswordReset(email) {
  if (!apiEnabled) return { error: NEEDS_SERVER }
  const res = await api('/auth/forgot', { method: 'POST', body: { email } })
  return res.ok ? { message: res.data.message } : { error: res.data.error || 'Something went wrong. Please try again.' }
}

export async function resetPassword(token, password) {
  if (!apiEnabled) return { error: NEEDS_SERVER }
  const res = await api('/auth/reset', { method: 'POST', body: { token, password } })
  return res.ok ? { message: res.data.message } : { error: res.data.error || 'Something went wrong. Please try again.', fields: res.data.fields }
}
