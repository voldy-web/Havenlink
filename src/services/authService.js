// Sign-up and sign-in. DEMO ONLY: accounts live in this browser (localStorage).
// Passwords are checked for length but NEVER stored, because a browser is not a
// safe place for them. Real accounts, hashed passwords and sessions arrive with
// the backend; then only the inside of these functions changes.
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

export function getSessionUser() {
  const email = read(SESSION_KEY, null)
  return email ? read(ACCOUNTS_KEY, []).find((a) => a.email === email) || null : null
}

export async function registerAccount({ name, email, phone, role }) {
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

export async function signIn(email) {
  const account = read(ACCOUNTS_KEY, []).find((a) => a.email === normalise(email))
  if (!account) return { error: 'We could not find an account with that email. Create one first.' }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(account.email))
  } catch {
    return { error: 'Your browser blocked signing in. Turn off private mode and try again.' }
  }
  return { user: account }
}

export function signOut() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Nothing to clear if storage is blocked.
  }
}
