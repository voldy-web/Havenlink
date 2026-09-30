import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'
import './Footer.css'

// Footer link columns. Edit here to change the footer everywhere.
const columns = [
  {
    title: 'Explore',
    links: [
      { to: '/properties?type=rent', label: 'Rent Properties' },
      { to: '/properties?type=buy', label: 'Buy Properties' },
      { to: '/properties', label: 'Verified Apartments' },
    ],
  },
  {
    title: 'Services & Living',
    links: [
      { to: '/services', label: 'Plumbing & Pipes' },
      { to: '/services', label: 'Electrical Diagnostics' },
      { to: '/services', label: 'Carpentry & Woodwork' },
      { to: '/shop', label: 'Furniture Shop' },
      { to: '/shop', label: 'Smart Appliances' },
    ],
  },
  {
    title: 'Support & Legal',
    links: [
      { to: '/help', label: 'Trust & Safety' },
      { to: '/help', label: 'Help Center & FAQs' },
      { to: '/terms', label: 'Terms of Service' },
      { to: '/privacy', label: 'Privacy Statement' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <img src={logo} alt="Haven Link - Housing Management" />
          <p>
            Sanctuary, clarity, and competence. Your unified ecosystem for
            finding a home, living in it and keeping it in good shape.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="footer__title">{col.title}</h4>
            <ul>
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} Haven Link. All rights reserved.</span>
        <span>Clean living, simplified.</span>
      </div>
    </footer>
  )
}
