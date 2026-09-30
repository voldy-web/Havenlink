// The four kinds of account (from the proposal). Only "resident" has a
// finished dashboard so far; the other portals are built after the backend.
export const roles = [
  { id: 'resident', label: 'Resident / Tenant', icon: 'key', text: 'Rent or buy a home, book viewings, report problems, hire pros and shop.' },
  { id: 'owner', label: 'Property Owner', icon: 'home', text: 'List homes, manage viewings and enquiries, and follow tenant issues.' },
  { id: 'pro', label: 'Service Pro', icon: 'tool', text: 'Get listed in the directory and receive paid jobs from nearby clients.' },
  { id: 'vendor', label: 'Home Vendor', icon: 'bag', text: 'Sell furniture and appliances to people furnishing a new home.' },
]
