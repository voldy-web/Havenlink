// Viewing bookings. Today the mock availability rules live here and bookings
// are saved in the browser (localStorage) so they survive a page refresh.
// When the backend exists, these functions will call the API instead and
// the booking page will not need to change.
import { apiEnabled, apiOrThrow } from './api'

const STORAGE_KEY = 'havenlink_viewings'

// Mock rules: Sundays are closed and every 7th day of the month is fully
// booked. The backend will supply the real owner availability.
// Returns "past" | "off" | "full" | "open".
export function getDayStatus(date, today) {
  if (date < today) return 'past'
  if (date.getDay() === 0) return 'off'
  if (date.getDate() % 7 === 0) return 'full'
  return 'open'
}

// Time slots offered on a day, grouped for display. Saturdays are half days.
export function getSlots(date) {
  const day = date.getDay()
  const groups = [
    { key: 'morning', label: 'Morning', icon: 'sun', times: ['9:30 AM', '11:00 AM'] },
    { key: 'afternoon', label: 'Afternoon', icon: 'sun', times: day === 6 ? [] : ['1:30 PM', '3:00 PM', '4:30 PM'] },
    { key: 'evening', label: 'Evening', icon: 'moon', times: day === 6 || day === 5 ? [] : ['6:00 PM'] },
  ]
  return groups.filter((g) => g.times.length > 0)
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

// Saves a booking request and returns it with a reference number.
async function demoCreateViewing(details) {
  const booking = {
    ...details,
    reference: `HL-V-${Date.now().toString().slice(-6)}`,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([booking, ...readAll()]))
  } catch {
    // Storage can be blocked (private browsing). The booking still shows on screen.
  }
  return booking
}

async function demoGetMyViewings() {
  return readAll()
}

// Cancels a viewing request. It stays in the list marked "Cancelled".
async function demoCancelViewing(reference) {
  const list = readAll().map((v) => (v.reference === reference ? { ...v, status: 'Cancelled' } : v))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // Storage blocked: the change is not saved.
  }
  return list
}

// ---- What the pages use: the real API when connected, otherwise the browser demo ----
export const createViewing = (details) =>
  apiEnabled ? apiOrThrow('/viewings', { method: 'POST', body: details }).then((d) => d.viewing) : demoCreateViewing(details)

export const getMyViewings = () =>
  apiEnabled ? apiOrThrow('/viewings').then((d) => d.viewings) : demoGetMyViewings()

export async function cancelViewing(reference) {
  if (!apiEnabled) return demoCancelViewing(reference)
  await apiOrThrow(`/viewings/${reference}/cancel`, { method: 'PATCH' })
  return getMyViewings()
}
