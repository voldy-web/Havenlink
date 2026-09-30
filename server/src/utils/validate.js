// Small input checks used by the routes. Each returns an error message, or
// null when the value is fine. Never trust what the browser sends.
export const ROLES_SELF_SERVE = ['resident', 'owner', 'pro', 'vendor']

const text = (v) => (typeof v === 'string' ? v.trim() : '')

export function checkName(v) {
  const s = text(v)
  return s.length < 2 || s.length > 80 ? 'Name must be 2 to 80 characters.' : null
}

export function checkEmail(v) {
  const s = text(v)
  return s.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? 'Enter a valid email address.' : null
}

export function checkPhone(v) {
  const digits = text(v).replace(/\D/g, '')
  return digits.length < 9 || digits.length > 15 || text(v).length > 25 ? 'Enter a valid phone number.' : null
}

// bcrypt only reads the first 72 bytes, so longer passwords are refused.
export function checkNewPassword(v) {
  if (typeof v !== 'string' || v.length < 8) return 'Password must be at least 8 characters.'
  if (Buffer.byteLength(v) > 72) return 'Password must be 72 bytes or fewer.'
  return null
}

export function checkRole(v) {
  return ROLES_SELF_SERVE.includes(v) ? null : 'Choose a valid account type.'
}

export const clean = { text, email: (v) => text(v).toLowerCase() }
