// The Google "client id" from Google Cloud Console. It is public (not a secret) but is baked in at build time.
import { apiEnabled } from './api'

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
// The button only shows when the real server is in use and a client id was provided.
export const googleEnabled = apiEnabled && Boolean(GOOGLE_CLIENT_ID)
