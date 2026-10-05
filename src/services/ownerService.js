// What an owner can do with their own homes. These need the real server
// (VITE_API_URL), because listings and photos are stored in the database.
import { apiEnabled, apiOrThrow } from './api'
import { resizeToDataUrl } from '../utils/resizeImage'

function needServer() {
  if (!apiEnabled) throw new Error('Owner tools need the live server. Set VITE_API_URL to use them.')
}

export const listMyListings = async () => { needServer(); return (await apiOrThrow('/owner/properties')).listings }
export const getMyListing = async (id) => { needServer(); return (await apiOrThrow(`/owner/properties/${id}`)).listing }
export const createListing = async (form) => { needServer(); return (await apiOrThrow('/owner/properties', { method: 'POST', body: form })).listing }
export const updateListing = async (id, form) => { needServer(); return (await apiOrThrow(`/owner/properties/${id}`, { method: 'PUT', body: form })).listing }
export const setListingPaused = async (id, paused) => (await apiOrThrow(`/owner/properties/${id}/${paused ? 'pause' : 'resume'}`, { method: 'POST', body: {} })).listing
export const deleteListing = async (id) => { await apiOrThrow(`/owner/properties/${id}`, { method: 'DELETE' }) }

// Shrinks a photo, uploads it, and returns its key (for example "upload:12").
export async function uploadPhoto(file) {
  needServer()
  const dataUrl = await resizeToDataUrl(file)
  return (await apiOrThrow('/images', { method: 'POST', body: { dataUrl } })).image.key
}

// ---- Viewing requests for the owner's homes ----
export const getOwnerSummary = async () => apiOrThrow('/owner/summary')
export const listOwnerViewings = async () => { needServer(); return (await apiOrThrow('/owner/viewings')).viewings }
// action: "confirm", "decline" (needs a note) or "reschedule" (needs a date and time).
export const respondToViewing = async (reference, action, body = {}) =>
  (await apiOrThrow(`/owner/viewings/${reference}/${action}`, { method: 'POST', body })).viewing

// Tells the owner's menu badge to re-count straight away (for example after answering a request).
export const OWNER_SUMMARY_CHANGED = 'havenlink:owner-summary-changed'
export const announceOwnerSummaryChanged = () => window.dispatchEvent(new Event(OWNER_SUMMARY_CHANGED))
