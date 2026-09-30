import { useCallback, useEffect, useMemo, useState } from 'react'
import { SavedContext } from './SavedContext'

const KEY = 'havenlink_saved_homes'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export default function SavedProvider({ children }) {
  const [ids, setIds] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids))
    } catch {
      // Storage can be blocked. Saving still works until the tab closes.
    }
  }, [ids])

  const toggle = useCallback((id) => {
    setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }, [])

  const value = useMemo(() => ({ ids, toggle, isSaved: (id) => ids.includes(id) }), [ids, toggle])
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}
