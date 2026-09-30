// Small date helpers. Dates are handled in the visitor's own timezone and
// passed around as "yyyy-mm-dd" text (for example in page addresses).
const pad = (n) => String(n).padStart(2, '0')

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function fromISO(text) {
  const [y, m, d] = text.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const isValidISO = (text) =>
  /^\d{4}-\d{2}-\d{2}$/.test(text || '') && !Number.isNaN(fromISO(text).getTime())

export function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// Every cell of a month calendar, Monday first. Days before the 1st are
// null so the grid lines up under the weekday headings.
export function monthCells(year, month) {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks = (first.getDay() + 6) % 7
  return [
    ...Array(blanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]
}

export const longDate = (d) =>
  d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
