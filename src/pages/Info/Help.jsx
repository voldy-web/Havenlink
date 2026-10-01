import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import InfoPage from './InfoPage'
import { faqGroups, safetyTips } from '../../data/faqs'

// Set VITE_SUPPORT_EMAIL (see .env.example) to show a contact address on this page.
const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || ''

export default function Help() {
  return (
    <InfoPage eyebrow="Help Center" title="How can we help?" intro="Quick answers about homes, reports, providers, the shop and your account.">
      {faqGroups.map((g) => (
        <section key={g.title} className="faq">
          <h2>{g.title}</h2>
          {g.items.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>
      ))}

      <section className="info__safety">
        <h2><Icon name="shield" size={20} /> Trust &amp; Safety</h2>
        <ul>
          {safetyTips.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </section>

      <section className="info__contact">
        <h2>Still need help?</h2>
        {supportEmail ? (
          <p>Email us at <a href={`mailto:${supportEmail}`}>{supportEmail}</a> and include your account email so we can find you quickly.</p>
        ) : (
          <p>Support contact details will be shown here soon. In the meantime, you can report a problem with your home from your dashboard.</p>
        )}
        <div className="info__contact-buttons">
          <Button to="/messages/new?kind=support">Message support</Button>
          <Button to="/reports/new" variant="outline">Report a problem</Button>
        </div>
      </section>
    </InfoPage>
  )
}
