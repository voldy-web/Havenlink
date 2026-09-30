import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import ViewingCalendar from './ViewingCalendar'
import { getPropertyById, getAgentById } from '../../services/propertyService'
import { createViewing, getDayStatus, getSlots } from '../../services/viewingService'
import { fromISO, isValidISO, longDate, startOfToday, toISO } from '../../utils/dates'
import { formatPrice } from '../../utils/format'
import './BookViewing.css'

const formats = [
  { id: 'in-person', icon: 'pin', title: 'In-Person Walkthrough', text: 'A guided private viewing of the home, with the owner or agent.', tag: 'Meet on site' },
  { id: 'video', icon: 'video', title: 'Live Video Tour', text: 'A live video call where the owner walks you through and answers questions.', tag: 'From anywhere' },
]

const emptyForm = { name: '', phone: '', email: '', attendees: 1, moveIn: '', pet: 'none' }

// The first bookable day starting tomorrow.
function firstOpenDay(today) {
  for (let i = 1; i < 60; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (getDayStatus(d, today) === 'open') return toISO(d)
  }
  return ''
}

export default function BookViewing() {
  const { id } = useParams()
  const [query] = useSearchParams()

  const [loaded, setLoaded] = useState({ id: null, property: null, agent: null })
  const [today] = useState(() => startOfToday())

  // Starting choices come from the property page (?format=&date=&time=).
  const [format, setFormat] = useState(query.get('format') === 'video' ? 'video' : 'in-person')
  const [date, setDate] = useState(() => {
    const wanted = query.get('date')
    if (isValidISO(wanted) && getDayStatus(fromISO(wanted), startOfToday()) === 'open') return wanted
    return firstOpenDay(startOfToday())
  })
  const [time, setTime] = useState(query.get('time') || '')
  const [monthOffset, setMonthOffset] = useState(() => {
    const wanted = query.get('date')
    if (!isValidISO(wanted)) return 0
    const t = startOfToday()
    const d = fromISO(wanted)
    return Math.max(0, Math.min(2, (d.getFullYear() - t.getFullYear()) * 12 + d.getMonth() - t.getMonth()))
  })
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      const property = await getPropertyById(id)
      const agent = property ? await getAgentById(property.agentId) : null
      return { id, property, agent }
    }
    load().then((r) => { if (!ignore) setLoaded(r) })
    return () => { ignore = true }
  }, [id])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [booking])

  const { property, agent } = loaded
  if (loaded.id !== id) return <div className="container book"><p>Loading…</p></div>
  if (!property) {
    return (
      <section className="container book book--empty">
        <h1>Property not found</h1>
        <Button to="/properties">Browse Properties</Button>
      </section>
    )
  }

  const slots = date ? getSlots(fromISO(date)) : []
  const validTime = slots.some((g) => g.times.includes(time))
  const change = (patch) => setForm((f) => ({ ...f, ...patch }))

  function pickDate(iso) {
    setDate(iso)
    // Keep the chosen time only if it is also offered on the new day.
    if (!getSlots(fromISO(iso)).some((g) => g.times.includes(time))) setTime('')
  }

  function validate() {
    const e = {}
    if (form.name.trim().length < 2) e.name = 'Please enter your full name.'
    if (form.phone.replace(/\D/g, '').length < 9) e.phone = 'Please enter a valid phone number.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email address.'
    if (!date) e.date = 'Please choose a date.'
    if (!validTime) e.time = 'Please choose a time.'
    return e
  }

  async function submit(ev) {
    ev.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // Jump to the first problem so the visitor sees what to fix.
      const first = document.querySelector('[aria-invalid="true"], .book__error')
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const saved = await createViewing({
      propertyId: property.id,
      propertyTitle: property.title,
      format,
      date,
      time,
      ...form,
      name: form.name.trim(),
    })
    setBooking(saved)
  }

  const forRent = property.listingType === 'rent'
  const formatName = formats.find((f) => f.id === format).title

  // ---- Confirmation screen ----
  if (booking) {
    return (
      <section className="container book book--done">
        <span className="book__done-icon"><Icon name="check" size={32} /></span>
        <h1>Viewing requested</h1>
        <p>
          {agent ? `${agent.name} will` : 'The owner will'} confirm your time or
          suggest another one. Keep your reference number handy.
        </p>
        <dl className="book__summary">
          <div><dt>Reference</dt><dd>{booking.reference}</dd></div>
          <div><dt>Home</dt><dd>{property.title}</dd></div>
          <div><dt>Type</dt><dd>{formatName}</dd></div>
          <div><dt>When</dt><dd>{longDate(fromISO(booking.date))} at {booking.time}</dd></div>
          <div><dt>Name</dt><dd>{booking.name}</dd></div>
          <div><dt>Status</dt><dd>Waiting for the owner to confirm</dd></div>
        </dl>
        <div className="book__done-actions">
          <Button to={`/properties/${property.id}`}>Back to property</Button>
          <Button to="/properties" variant="outline">Browse more homes</Button>
        </div>
      </section>
    )
  }

  // ---- Booking form ----
  return (
    <div className="container book">
      <nav className="book__crumbs" aria-label="Breadcrumb">
        <Link to={`/properties/${property.id}`}>&larr; Back to {property.title}</Link>
      </nav>
      <h1>Book a Viewing</h1>

      <form id="viewing-form" className="book__layout" onSubmit={submit} noValidate>
        <div className="book__steps">
          {/* Step 1 */}
          <section className="step">
            <p className="step__eyebrow">Step 1 · Viewing format</p>
            <h2>Select Tour Experience</h2>
            <p className="step__sub">Choose how you would like to tour this home.</p>
            <div className="formats">
              {formats.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={format === f.id ? 'is-active' : ''}
                  aria-pressed={format === f.id}
                  onClick={() => setFormat(f.id)}
                >
                  <span className="formats__icon"><Icon name={f.icon} size={20} /></span>
                  {format === f.id && <span className="formats__tick"><Icon name="check" size={18} /></span>}
                  <b>{f.title}</b>
                  <span>{f.text}</span>
                  <small>{f.tag}</small>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2 */}
          <section className="step">
            <p className="step__eyebrow">Step 2 · Date &amp; time</p>
            <h2>Choose a Day and Time</h2>
            <ViewingCalendar
              today={today}
              offset={monthOffset}
              onOffsetChange={setMonthOffset}
              selected={date}
              onSelect={pickDate}
            />
            {errors.date && <p className="book__error">{errors.date}</p>}

            {date && (
              <div className="slots">
                <h3><Icon name="clock" size={17} /> Available times for {longDate(fromISO(date))}</h3>
                {slots.map((g) => (
                  <div key={g.key}>
                    <h4><Icon name={g.icon} size={14} /> {g.label}</h4>
                    <div className="slots__row">
                      {g.times.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={time === t ? 'is-active' : ''}
                          aria-pressed={time === t}
                          onClick={() => setTime(t)}
                        >
                          {time === t && <Icon name="check" size={14} />} {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {errors.time && <p className="book__error">{errors.time}</p>}
          </section>

          {/* Step 3 */}
          <section className="step">
            <p className="step__eyebrow">Step 3 · Your details</p>
            <h2>Visitor Information</h2>
            <p className="step__sub">The owner uses these details to confirm your viewing.</p>

            <div className="fields">
              <label>
                <span>Full name</span>
                <input
                  value={form.name}
                  onChange={(e) => change({ name: e.target.value })}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'err-name' : undefined}
                />
                {errors.name && <em id="err-name">{errors.name}</em>}
              </label>
              <label>
                <span>Mobile phone</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => change({ phone: e.target.value })}
                  placeholder="+233 20 000 0000"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'err-phone' : undefined}
                />
                {errors.phone && <em id="err-phone">{errors.phone}</em>}
              </label>
              <label className="fields__wide">
                <span>Email address</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => change({ email: e.target.value })}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'err-email' : undefined}
                />
                {errors.email && <em id="err-email">{errors.email}</em>}
              </label>

              <div>
                <span className="fields__label">Attendees</span>
                <div className="attendees">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={form.attendees === n ? 'is-active' : ''}
                      aria-pressed={form.attendees === n}
                      onClick={() => change({ attendees: n })}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {forRent && (
                <label>
                  <span>Target move-in</span>
                  <input
                    type="date"
                    min={toISO(today)}
                    value={form.moveIn}
                    onChange={(e) => change({ moveIn: e.target.value })}
                  />
                </label>
              )}
              <label>
                <span>Pets</span>
                <select value={form.pet} onChange={(e) => change({ pet: e.target.value })}>
                  <option value="none">No pets</option>
                  <option value="dog">A dog</option>
                  <option value="cat">A cat</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
          </section>
        </div>

        {/* Summary panel */}
        <aside className="book__side">
          <section className="summary">
            <div className="summary__photo">
              <img src={property.detailImage || property.image} alt={property.title} />
              <span>{property.status === 'Available' ? 'Available' : property.status}</span>
              <div>
                <small>{property.area.toUpperCase()} · {property.city.toUpperCase()}</small>
                <h3>{property.title}</h3>
                <p>{property.address}</p>
              </div>
            </div>

            <div className="summary__body">
              <div className="summary__price">
                <div>
                  <small>{forRent ? 'Monthly rent' : 'Sale price'}</small>
                  <b>{formatPrice(property.price)}{forRent && <span> / mo</span>}</b>
                </div>
                <p>{property.beds} Bed · {property.baths} Bath · {property.sqm} sq m</p>
              </div>

              {agent && (
                <div className="summary__agent">
                  <span aria-hidden="true">{agent.name.split(' ').map((w) => w[0]).join('')}</span>
                  <div>
                    <b>{agent.name}</b>
                    <small>{agent.role}</small>
                    <small><Icon name="star" size={11} /> {agent.rating} ({agent.reviews} reviews)</small>
                  </div>
                  <a href={`tel:${agent.phone}`} aria-label={`Call ${agent.name}`}><Icon name="phone" size={15} /></a>
                  <Link to="/messages" aria-label={`Chat with ${agent.name}`}><Icon name="chat" size={15} /></Link>
                </div>
              )}

              <h4>Your viewing</h4>
              <ul className="summary__chips">
                <li><Icon name={format === 'video' ? 'video' : 'pin'} size={13} /> {formatName}</li>
                <li><Icon name="calendar" size={13} /> {date ? fromISO(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Pick a date'}</li>
                <li><Icon name="clock" size={13} /> {validTime ? time : 'Pick a time'}</li>
              </ul>

              <div className="summary__note">
                <h4><Icon name="pin" size={14} /> Arrival instructions</h4>
                <p>
                  {format === 'video'
                    ? 'The owner will send you a video link once your time is confirmed.'
                    : `Meet ${agent ? agent.name.split(' ')[0] : 'the owner'} at the property about 10 minutes before your time. Please bring a valid ID.`}
                </p>
              </div>

              <button type="submit" className="summary__confirm">
                Confirm &amp; Book Viewing — Free <Icon name="arrow" size={16} />
              </button>
              <p className="summary__policy">
                <Icon name="shield" size={13} /> Free cancellation up to 2 hours before.
              </p>
            </div>
          </section>
        </aside>
      </form>
    </div>
  )
}
