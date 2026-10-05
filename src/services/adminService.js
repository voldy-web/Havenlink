// The admin review queue for homes that owners post (admin accounts only).
import { apiOrThrow } from './api'

export const listForReview = async (status = 'pending') => (await apiOrThrow(`/admin/properties?status=${status}`)).listings
export const getForReview = async (id) => (await apiOrThrow(`/admin/properties/${id}`)).listing
export const approveListing = async (id) => (await apiOrThrow(`/admin/properties/${id}/approve`, { method: 'POST', body: {} })).listing
export const rejectListing = async (id, note) => (await apiOrThrow(`/admin/properties/${id}/reject`, { method: 'POST', body: { note } })).listing
