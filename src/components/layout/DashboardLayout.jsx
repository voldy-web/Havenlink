import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { roles } from '../../data/roles'
import './DashboardLayout.css'

// The frame for logged-in pages: a sidebar on the left (a row of tabs on
// phones) and the current page on the right.
const links = [
  { to: '/dashboard', label: 'Overview', icon: 'home', end: true },
  { to: '/dashboard/saved', label: 'Saved Homes', icon: 'heart' },
  { to: '/reports', label: 'My Reports', icon: 'shield' },
  { to: '/viewings', label: 'Viewings', icon: 'calendar' },
  { to: '/orders', label: 'Orders', icon: 'truck' },
  { to: '/messages', label: 'Messages', icon: 'chat' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { pathname, search } = useLocation()

  // Signed-out visitors go to the login page, then come straight back here.
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />

  // Only the resident dashboard is built so far; other portals come after the backend.
  if (user.role !== 'resident') {
    const label = roles.find((r) => r.id === user.role)?.label
    return (
      <section className="container dash-soon">
        <h1>Your {label} portal is coming soon</h1>
        <p>Hi {user.name.split(' ')[0]}, your account is ready. This portal is being built next, and you will be able to sign in here as soon as it is finished.</p>
        <div>
          <Button to="/">Back to Home</Button>
          <Button variant="outline" onClick={logout}>Sign out</Button>
        </div>
      </section>
    )
  }

  return (
    <div className="container dash">
      <nav className="dash__nav" aria-label="Dashboard">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            <Icon name={l.icon} size={17} /> {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="dash__content">
        <Outlet />
      </div>
    </div>
  )
}
