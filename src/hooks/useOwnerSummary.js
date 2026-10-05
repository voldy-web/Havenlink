import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getOwnerSummary, OWNER_SUMMARY_CHANGED } from '../services/ownerService'
import { getOpenRepairs } from '../services/tenancyService'

// How many viewing requests and open repair reports are waiting for the signed-in owner (for the badges in their menu).
// Re-checked when the page changes and every 30 seconds.
export function useOwnerSummary(enabled = true) {
  const [counts, setCounts] = useState({ pendingViewings: 0, openRepairs: 0 })
  const { pathname } = useLocation()

  useEffect(() => {
    if (!enabled) return undefined
    let ignore = false
    const check = () => Promise.all([getOwnerSummary(), getOpenRepairs()])
      .then(([s, openRepairs]) => { if (!ignore) setCounts({ pendingViewings: s.pendingViewings, openRepairs }) })
      .catch(() => {})
    check()
    const timer = setInterval(check, 30000)
    window.addEventListener(OWNER_SUMMARY_CHANGED, check)
    return () => { ignore = true; clearInterval(timer); window.removeEventListener(OWNER_SUMMARY_CHANGED, check) }
  }, [pathname, enabled])

  return counts
}
