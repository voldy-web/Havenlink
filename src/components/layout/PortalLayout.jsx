import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import Icon from '../ui/Icon'
import { useAuth } from '../../hooks/useAuth'
import { useUnreadMessages } from '../../hooks/useUnreadMessages'
import { useOwnerSummary } from '../../hooks/useOwnerSummary'
import './DashboardLayout.css'

// The frame for the owner and admin areas: a sidebar plus the current page.
// Only people with the matching role get in; everyone else is sent to their own dashboard.
export default function PortalLayout({ role, links }) {
  const { user, loading } = useAuth()
  const { pathname, search } = useLocation()
  // Numbers for the badges in the owner's menu.
  const unread = useUnreadMessages(role === 'owner' && Boolean(user))
  const { pendingViewings, openRepairs } = useOwnerSummary(role === 'owner' && Boolean(user))
  const badges = { messages: unread, viewings: pendingViewings, repairs: openRepairs }

  if (loading) return <p className="container dash">Loading…</p>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />
  if (user.role !== role) return <Navigate to="/dashboard" replace />

  return (
    <div className="container dash">
      <nav className="dash__nav" aria-label={`${role} menu`}>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            <Icon name={l.icon} size={17} /> {l.label}
            {l.badge && badges[l.badge] > 0 && <i className="msg__nav-badge" aria-label={`${badges[l.badge]} waiting`}>{badges[l.badge]}</i>}
          </NavLink>
        ))}
      </nav>
      <div className="dash__content">
        <Outlet />
      </div>
    </div>
  )
}
