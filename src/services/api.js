// The one place the front end talks to the backend (the "server/" folder).
// Set VITE_API_URL (for example http://localhost:4000) to use the real API.
// When it is empty the site runs in DEMO mode with data kept in the browser.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'havenlink_token'

export const apiEnabled = Boolean(API_URL)

// Buttons that let you push your own report or order to the next stage, for
// trying things out. Always on in demo mode. With the real API they need
// VITE_DEMO_TOOLS=true here AND DEMO_TOOLS=true on the server.
export const demoTools = !apiEnabled || import.meta.env.VITE_DEMO_TOOLS === 'true'

// The login token is kept in localStorage so a refresh keeps you signed in.
// (Trade-off: any script running on the page could read it, so the site must
// never load untrusted scripts. Moving to same-site cookies is the upgrade.)
export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage blocked (private mode): you will need to sign in again after a refresh.
  }
}

// Calls the API. Always resolves with { ok, status, data }; never throws, so
// pages can show a friendly message when the server is down.
export async function api(path, { method = 'GET', body, auth = false } = {}) {
  try {
    const token = auth ? getToken() : null
    const res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: { error: 'Cannot reach the server. Check your internet and try again.' } }
  }
}

// Like api(), but returns just the data and THROWS an Error with a friendly
// message when the server says no (so pages can catch it and show it).
export async function apiOrThrow(path, options) {
  const res = await api(path, { auth: true, ...options })
  if (res.ok) return res.data
  const firstField = res.data.fields && Object.values(res.data.fields)[0]
  throw Object.assign(new Error(firstField || res.data.error || 'Something went wrong. Please try again.'), { fields: res.data.fields })
}
