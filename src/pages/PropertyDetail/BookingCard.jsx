import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { formatPrice } from '../../utils/format'
import './BookingCard.css'

const timeSlots = ['9:30 AM', '11:00 AM', '1:30 PM', '3:00 PM', '4:30 PM', '6:00 PM']

// The next few days a viewing can be booked.
function nextDays(count) {
  const today = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })
}

// yyyy-mm-dd in the visitor's own timezone (used in the booking link).
const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function BookingCard({ property }) {
  const navigate = useNavigate()
  const [days] = useState(() => nextDays(4))
  const [format, setFormat] = useState('in-person')
  const [dayIndex, setDayIndex] = useState(1)
  const [time, setTime] = useState('3:00 PM')

  const forRent = property.listingType === 'rent'
  const monthLabel = days[dayIndex].toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  function dayName(d, i) {
    if (i === 0) return 'Today'
    if (i === 1) return 'Tmrw'
    return d.toLocaleString('en-GB', { month: 'short' })
  }

  // The full booking page (visitor details, confirmation) comes next;
  // for now the chosen options are passed along in the address.
  function confirm() {
    const params = new URLSearchParams({ format, date: isoDate(days[dayIndex]), time })
    navigate(`/properties/${property.id}/book?${params}`)
  }

  return (
    <section className="booking" aria-label="Book a viewing">
      <div className="booking__price">
        <p>
          {formatPrice(property.price)}
          <span>{forRent ? ' / month' : ' sale price'}</span>
        </p>
        <b>Free viewing</b>
      </div>

      {property.status !== 'Available' && (
        <p className="booking__notice">
          This home is {property.status.toLowerCase()}. You can still book a
          viewing in case it becomes available.
        </p>
      )}

      <h3>Select Tour Format</h3>
      <div className="booking__segmented">
        <button
          className={format === 'in-person' ? 'is-active' : ''}
          onClick={() => setFormat('in-person')}
        >
          <Icon name="user" size={14} /> In-Person
        </button>
        <button
          className={format === 'video' ? 'is-active' : ''}
          onClick={() => setFormat('video')}
        >
          <Icon name="video" size={14} /> Live Video
        </button>
      </div>

      <div className="booking__row">
        <h3>Select Viewing Date</h3>
        <span>{monthLabel}</span>
      </div>
      <div className="booking__days">
        {days.map((d, i) => (
          <button
            key={i}
            className={dayIndex === i ? 'is-active' : ''}
            onClick={() => setDayIndex(i)}
            aria-pressed={dayIndex === i}
          >
            <small>{dayName(d, i)}</small>
            <b>{d.getDate()}</b>
            <small>{d.toLocaleString('en-GB', { weekday: 'short' })}</small>
          </button>
        ))}
      </div>

      <h3>Available Arrival Window</h3>
      <div className="booking__times">
        {timeSlots.map((t) => (
          <button
            key={t}
            className={time === t ? 'is-active' : ''}
            onClick={() => setTime(t)}
            aria-pressed={time === t}
          >
            {t}
          </button>
        ))}
      </div>

      <button className="booking__confirm" onClick={confirm}>
        <Icon name="calendar" size={16} /> Confirm Viewing Appointment
      </button>
      <p className="booking__fine">
        <Icon name="check" size={14} /> No obligation. The owner will confirm
        your time or suggest another.
      </p>
    </section>
  )
}
