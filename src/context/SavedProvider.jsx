import { useCallback, useEffect, useMemo, useState } from 'react'
import { SavedContext } from './SavedContext'
import { useAuth } from '../hooks/useAuth'
import { api, apiEnabled } from '../services/api'

const KEY = 'havenlink_saved_homes'

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

// Saved homes. Signed-in people (with the real API) keep them on the server so
// they follow the account; guests and demo mode keep them in this browser.
function Saved({ userId, children }) {
  const synced = apiEnabled && Boolean(userId)
  const [ids, setIds] = useState(loadLocal)

  // On sign-in: upload anything saved as a guest, then use the server's list.
  useEffect(() => {
    if (!synced) return undefined
    let ignore = false
    async function sync() {
      const guest = loadLocal()
      await Promise.all(guest.map((id) => api(`/saved/${id}`, { method: 'PUT', auth: true })))
      try { localStorage.removeItem(KEY) } catch { /* nothing to clear */ }
      const res = await api('/saved', { auth: true })
      if (!ignore && res.ok) setIds(res.data.ids)
    }
    sync()
    return () => { ignore = true }
  }, [synced])

  // Guests and demo mode: remember the list in this browser.
  useEffect(() => {
    if (synced) return
    try {
      localStorage.setItem(KEY, JSON.stringify(ids))
    } catch {
      // Storage can be blocked. Saving still works until the tab closes.
    }
  }, [ids, synced])

  const toggle = useCallback(async (id) => {
    const has = ids.includes(id)
    setIds((cur) => (has ? cur.filter((x) => x !== id) : [...cur, id]))
    if (!synced) return
    const res = await api(`/saved/${id}`, { method: has ? 'DELETE' : 'PUT', auth: true })
    // If the server refused, put the heart back the way it was.
    if (!res.ok) setIds((cur) => (has ? [...cur, id] : cur.filter((x) => x !== id)))
  }, [ids, synced])

  const value = useMemo(() => ({ ids, toggle, isSaved: (id) => ids.includes(id) }), [ids, toggle])
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}

// Starts fresh whenever the signed-in person changes (sign in, sign out, switch).
export default function SavedProvider({ children }) {
  const { user } = useAuth()
  return <Saved key={user?.id ?? 'guest'} userId={user?.id}>{children}</Saved>
}
