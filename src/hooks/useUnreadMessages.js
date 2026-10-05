import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { listConversations, MESSAGES_CHANGED } from '../services/messageService'

// How many unread messages the signed-in person has (for the badge on the Messages link).
// Re-checked when the page changes and every 30 seconds.
export function useUnreadMessages(enabled = true) {
  const [count, setCount] = useState(0)
  const { pathname } = useLocation()

  useEffect(() => {
    if (!enabled) return undefined
    let ignore = false
    const check = () => listConversations()
      .then((list) => { if (!ignore) setCount(list.reduce((n, c) => n + c.unread, 0)) })
      .catch(() => {})
    check()
    const timer = setInterval(check, 30000)
    window.addEventListener(MESSAGES_CHANGED, check)
    return () => { ignore = true; clearInterval(timer); window.removeEventListener(MESSAGES_CHANGED, check) }
  }, [pathname, enabled])

  return count
}
