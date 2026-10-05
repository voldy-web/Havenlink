// Tenancies: the resident's offers and tenancy, and the owner's side of them (offers, move-in
// and move-out checks, repairs). These need the real server (VITE_API_URL).
import { apiEnabled, apiOrThrow } from './api'

function needServer() {
  if (!apiEnabled) throw new Error('Tenancies need the live server. Set VITE_API_URL to use them.')
}
const post = (path, body = {}) => apiOrThrow(path, { method: 'POST', body })

// ---- the resident ----
export const listMyTenancies = async () => { needServer(); return (await apiOrThrow('/tenancies')).tenancies }
// action: "accept", "decline", "move-in" (needs items) or "notice" (needs moveOutDate).
export const tenancyAction = async (reference, action, body = {}) => { needServer(); return (await post(`/tenancies/${reference}/${action}`, body)).tenancy }

// ---- the owner ----
export const listOwnerTenancies = async () => { needServer(); return (await apiOrThrow('/owner/tenancies')).tenancies }
export const offerTenancy = async (form) => (await post('/owner/tenancies', form)).tenancy
// action: "withdraw", "move-in/acknowledge" or "settle" (needs items, deductions, notes).
export const ownerTenancyAction = async (reference, action, body = {}) => (await post(`/owner/tenancies/${reference}/${action}`, body)).tenancy
export const listOwnerRepairs = async () => { needServer(); return (await apiOrThrow('/owner/repairs')).reports }
export const setRepairStatus = async (reference, status, note) => (await post(`/owner/repairs/${reference}/status`, { status, note })).report
export const getOpenRepairs = async () => (await apiOrThrow('/owner/summary-repairs')).openRepairs

export const ROOMS = ['Living room', 'Bedroom', 'Kitchen', 'Bathroom', 'Outdoor or other']
export const CONDITIONS = ['Good', 'Fair', 'Poor']
