import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.png'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import { useCart } from '../../hooks/useCart'
import './Navbar.css'

// Main navigation links, in the order shown in the design.
const links = [
  { to: '/', label: 'Home' },
  { to: '/properties?type=buy', label: 'Buy' },
  { to: '/properties?type=rent', label: 'Rent' },
  { to: '/services', label: 'Services' },
  { to: '/shop', label: 'Shop' },
  { to: '/dashboard', label: 'Dashboard' },
]

export default function Navbar() {
  const { pathname, search } = useLocation()
  const { count } = useCart()

  // A link is "active" when its page is open. Buy and Rent share the
  // /properties page, so for those we also compare the ?type= value.
  function isActive(to) {
    const [path, query] = to.split('?')
    if (pathname !== path && !pathname.startsWith(`${path}/`)) return false
    if (!query) return true
    const wanted = new URLSearchParams(query).get('type')
    const current = new URLSearchParams(search).get('type') || 'rent'
    return wanted === current
  }

  // On phones the links are hidden behind a menu button.
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo" onClick={closeMenu}>
          <img src={logo} alt="Haven Link - Housing Management" />
        </Link>

        <nav className={`navbar__links ${menuOpen ? 'is-open' : ''}`}>
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={isActive(link.to) ? 'active' : ''}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search box: not wired up yet (comes with the search feature). */}
        <form className="navbar__search" role="search" onSubmit={(e) => e.preventDefault()}>
          <input type="search" placeholder="Search city, service..." aria-label="Search" />
        </form>

        <Link to="/cart" className="navbar__cart" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`} onClick={closeMenu}>
          <Icon name="bag" size={20} />
          {count > 0 && <span>{count}</span>}
        </Link>

        <Button to="/properties/new" size="sm" className="navbar__post">
          + Post Property
        </Button>

        {/* Placeholder user chip. Becomes real once login is built. */}
        <Link to="/login" className="navbar__user" onClick={closeMenu}>
          <span className="navbar__avatar" aria-hidden="true">MV</span>
          <span className="navbar__username">Marcus Vance</span>
        </Link>

        <button
          className="navbar__toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
