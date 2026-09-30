import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiEnabled } from '../services/api'

// Wraps a page that needs a signed-in person. With the real API, visitors who
// are signed out go to the login page and come straight back afterwards. In
// demo mode nothing is enforced, so the page works for everyone.
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const { pathname, search } = useLocation()
  if (!apiEnabled) return children
  if (loading) return <p className="container" style={{ padding: '48px 16px' }}>Loading…</p>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />
  return children
}
