import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { getProviderById, createServiceRequest } from '../../services/providerService'
import { buildProfile, providerContact } from '../../utils/providerProfile'
import PaymentForm from '../../components/ui/PaymentForm'
import { emptyPayment, validatePayment, paymentLabel } from '../../utils/payment'
import { formatPrice } from '../../utils/format'
import './ProviderPay.css'

const slotText = {
  morning: 'Morning (8-11 AM)',
  afternoon: 'Afternoon (1-4 PM)',
  urgent: 'Urgent - as soon as possible',
}
const steps = ['Service Details', 'Payment', 'Confirmation']

export default function ProviderPay() {
  const { id } = useParams()
  const [query] = useSearchParams()

  const [provider, setProvider] = useState({ id: null, data: null })
  const [payment, setPayment] = useState(emptyPayment)
  const [errors, setErrors] = useState({})
  const [paying, setPaying] = useState(false)
  const [done, setDone] = useState(null)

  useEffect(() => {
    let ignore = false
    getProviderById(id).then((data) => {
      if (!ignore) setProvider({ id, data })
    })
    return () => { ignore = true }
  }, [id])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [done])

  const p = provider.data
  if (provider.id !== id) return <div className="container pay"><p>Loading…</p></div>
  if (!p) {
    return (
      <section className="container pay pay--empty">
        <h1>Provider not found</h1>
        <Button to="/services">Browse Service Pros</Button>
      </section>
    )
  }

  const service = query.get('service')
  const slot = query.get('slot') || 'afternoon'
  const address = query.get('address')
  const note = query.get('note')

  // The details come from the provider's page. Without them, send the visitor back.
  if (!service || !address) {
    return (
      <section className="container pay pay--empty">
        <h1>Choose your service first</h1>
        <p>Please pick a service, time and address on {p.name}'s page.</p>
        <Button to={`/services/${p.id}`}>Back to {p.name}</Button>
      </section>
    )
  }

  const { trade } = buildProfile(p)
  const contact = providerContact(p)
  const first = p.name.split(' ')[0]
  const initials = p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')
  const stepIndex = done ? 2 : 1

  async function pay(ev) {
    ev.preventDefault()
    const found = validatePayment(payment)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      document.querySelector('[aria-invalid="true"]')?.focus()
      return
    }
    setPaying(true)
    // DEMO: pretend the payment takes a moment. A real payment provider
    // (mobile money / card gateway) will be connected with the backend.
    await new Promise((resolve) => setTimeout(resolve, 1200))
    const request = await createServiceRequest({
      providerId: p.id,
      providerName: p.name,
      service,
      slot,
      address,
      note: note || '',
      fee: p.fee,
      // Only the method is kept. Card and phone details are never stored.
      method: paymentLabel(payment),
    })
    setPaying(false)
    setDone(request)
  }

  return (
    <div className="container pay">
      <p className="pay__eyebrow">Step {stepIndex + 1} of 3</p>
      <div className="pay__title">
        <h1>{done ? 'Contact Unlocked' : 'Secure Payment'}</h1>
        <span className="pay__demo"><Icon name="shield" size={14} /> Demo mode: no real money is taken</span>
      </div>

      <ol className="stepper">
        {steps.map((label, i) => (
          <li key={label} className={i < stepIndex || (done && i === 2) ? 'is-done' : i === stepIndex ? 'is-current' : ''}>
            <span>{i < stepIndex || (done && i === 2) ? <Icon name="check" size={14} /> : i + 1}</span>
            <div>
              <small>{done && i === 2 ? 'Complete' : i === stepIndex ? 'In progress' : `Step ${i + 1}`}</small>
              <b>{label}</b>
            </div>
          </li>
        ))}
      </ol>

      {done ? (
        /* ---------- Step 3: confirmation ---------- */
        <div className="pay__layout">
          <div className="pay__main">
            <section className="pay-panel pay-success">
              <span className="pay-success__icon"><Icon name="check" size={30} /></span>
              <h2>You can now contact {p.name}</h2>
              <p>Call or message to agree the exact price and the day. Keep your reference number handy.</p>

              <div className="contact-reveal">
                <div>
                  <small>Phone</small>
                  <b>{contact.phone}</b>
                </div>
                <div>
                  <small>Email</small>
                  <b>{contact.email}</b>
                </div>
              </div>

              <div className="pay-success__buttons">
                <a className="btn btn--primary btn--md" href={`tel:${contact.phoneLink}`}>
                  <Icon name="phone" size={16} /> Call {first}
                </a>
                <Button to="/messages" variant="outline">
                  <Icon name="chat" size={16} /> Message {first}
                </Button>
              </div>
            </section>

            <section className="pay-panel">
              <h2>Your Booking</h2>
              <dl className="pay-list">
                <div><dt>Reference</dt><dd>{done.reference}</dd></div>
                <div><dt>Service</dt><dd>{done.service}</dd></div>
                <div><dt>Preferred time</dt><dd>{slotText[done.slot] || done.slot}</dd></div>
                <div><dt>Address</dt><dd>{done.address}</dd></div>
                {done.note && <div><dt>Note</dt><dd>{done.note}</dd></div>}
                <div><dt>Unlock fee paid</dt><dd>{formatPrice(done.fee)} via {done.method}</dd></div>
              </dl>
              <div className="pay-success__buttons">
                <Button to={`/services/${p.id}`} variant="outline">Back to {first}'s profile</Button>
                <Button to="/services" variant="secondary">Browse more pros</Button>
              </div>
            </section>
          </div>
        </div>
      ) : (
        /* ---------- Step 2: payment ---------- */
        <form className="pay__layout" onSubmit={pay} noValidate>
          <div className="pay__main">
            <section className="pay-panel">
              <div className="pay-window">
                <Icon name="clock" size={22} />
                <div>
                  <small>PREFERRED TIME</small>
                  <b>{slotText[slot] || slot}</b>
                </div>
                <Link to={`/services/${p.id}`}>Change</Link>
              </div>
              <div className="pay-cards">
                <div>
                  <small><Icon name="pin" size={13} /> SERVICE ADDRESS</small>
                  <b>{address}</b>
                </div>
                <div>
                  <small><Icon name="tool" size={13} /> SERVICE REQUESTED</small>
                  <b>{service}</b>
                  {note && <em>&ldquo;{note}&rdquo;</em>}
                </div>
              </div>
            </section>

            <section className="pay-panel">
              <h2>Payment Method</h2>
              <p className="pay-panel__sub">Choose how you would like to pay the unlock fee.</p>

              <PaymentForm value={payment} onChange={setPayment} errors={errors} />
            </section>

            <section className="pay-note">
              <span><Icon name="shield" size={20} /></span>
              <div>
                <h3>What you are paying for</h3>
                <p>
                  This small fee unlocks {p.name}'s phone number and email so you
                  can book directly. The work itself is priced by the provider
                  (from {formatPrice(p.rate)}/hr) and agreed with them.
                </p>
              </div>
            </section>

            <button type="submit" className="pay__confirm" disabled={paying}>
              <Icon name="lock" size={16} />
              {paying ? 'Processing payment…' : `Pay ${formatPrice(p.fee)} & Unlock Contact`}
            </button>
            <p className="pay__terms">By paying you agree to Haven Link's Terms of Service.</p>
          </div>

          <aside className="pay__side">
            <section className="pay-panel summary-card">
              <h2>Booking Summary</h2>
              <div className="pro-mini">
                <span aria-hidden="true">{initials}</span>
                <div>
                  <b>{p.name}</b>
                  <small>{trade.label} · {p.city}</small>
                  <small><Icon name="star" size={11} /> {p.rating} ({p.reviews})</small>
                </div>
              </div>

              <dl className="lines">
                <div><dt>Contact unlock fee</dt><dd>{formatPrice(p.fee)}</dd></div>
              </dl>
              <div className="total">
                <div>
                  <b>Total to pay today</b>
                  <small>One-off fee, shown up front</small>
                </div>
                <strong>{formatPrice(p.fee)}</strong>
              </div>

              <p className="summary-card__info">
                The work is priced by {first} and paid to them directly. Standard rate: {formatPrice(p.rate)}/hr.
              </p>
            </section>
          </aside>
        </form>
      )}
    </div>
  )
}
