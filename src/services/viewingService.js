// Viewing bookings. Today the mock availability rules live here and bookings
// are saved in the browser (localStorage) so they survive a page refresh.
// When the backend exists, these functions will call the API instead and
// the booking page will not need to change.

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
export async function createViewing(details) {
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

export async function getMyViewings() {
  return readAll()
}
