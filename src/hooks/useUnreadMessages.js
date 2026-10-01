import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { listConversations } from '../services/messageService'

// How many unread messages the signed-in person has (for the badge on the Messages link).
// Re-checked when the page changes and every 30 seconds.
export function useUnreadMessages() {
  const [count, setCount] = useState(0)
  const { pathname } = useLocation()

  useEffect(() => {
    let ignore = false
    const check = () => listConversations()
      .then((list) => { if (!ignore) setCount(list.reduce((n, c) => n + c.unread, 0)) })
      .catch(() => {})
    check()
    const timer = setInterval(check, 30000)
    return () => { ignore = true; clearInterval(timer) }
  }, [pathname])

  return count
}
