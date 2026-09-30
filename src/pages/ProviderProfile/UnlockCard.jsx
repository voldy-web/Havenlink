import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { formatPrice } from '../../utils/format'
import './UnlockCard.css'

const slots = [
  { id: 'morning', label: 'Morning', hours: '8-11 AM' },
  { id: 'afternoon', label: 'Afternoon', hours: '1-4 PM' },
  { id: 'urgent', label: 'Urgent', hours: 'Immediate', urgent: true },
]

// The panel where a client pays a small fee to unlock the provider's phone
// number and book them. Payment itself is the next page (coming soon).
export default function UnlockCard({ provider, priceList }) {
  const navigate = useNavigate()
  const [service, setService] = useState(priceList[0].name)
  const [slot, setSlot] = useState('afternoon')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const first = provider.name.split(' ')[0]

  function submit(e) {
    e.preventDefault()
    if (address.trim().length < 5) {
      setError('Please enter the address where the work is needed.')
      return
    }
    const params = new URLSearchParams({ service, slot, address: address.trim(), note: note.trim() })
    navigate(`/services/${provider.id}/pay?${params}`)
  }

  return (
    <form className="unlock" onSubmit={submit} noValidate>
      <div className="unlock__masked">
        <div>
          <b><Icon name="lock" size={13} /> Contact Protection</b>
          <span>Hidden</span>
        </div>
        <code>+233 •• ••• ••••</code>
        <code>{first.toLowerCase()}.••••@••••.com</code>
        <p>Pay the small fee below to reveal {first}'s direct phone number and book.</p>
      </div>

      <div className="unlock__fee">
        <div>
          <small>DIRECT BOOKING</small>
          <h3>Unlock &amp; Book</h3>
        </div>
        <b>{formatPrice(provider.fee)}<small>Haven fee</small></b>
      </div>

      <label className="unlock__field">
        <span>Select service type</span>
        <select value={service} onChange={(e) => setService(e.target.value)}>
          {priceList.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      </label>

      <div className="unlock__field">
        <span>Preferred time slot</span>
        <div className="unlock__slots">
          {slots.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`${slot === s.id ? 'is-active' : ''} ${s.urgent ? 'is-urgent' : ''}`}
              aria-pressed={slot === s.id}
              onClick={() => setSlot(s.id)}
            >
              <b>{s.label}</b>
              <small>{s.hours}</small>
            </button>
          ))}
        </div>
      </div>

      <label className="unlock__field">
        <span>Service address</span>
        <input
          value={address}
          onChange={(e) => { setAddress(e.target.value); setError('') }}
          placeholder="House number, street, area"
          autoComplete="street-address"
          aria-invalid={Boolean(error)}
        />
        {error && <em>{error}</em>}
      </label>

      <label className="unlock__field">
        <span>Issue note (optional)</span>
        <textarea
          rows="3"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Slow leak under the kitchen sink"
        />
      </label>

      <button type="submit" className="unlock__pay">
        <Icon name="lock" size={16} /> Pay {formatPrice(provider.fee)} to Unlock Contact
      </button>
      <p className="unlock__fine">The fee is shown up front. No other charges are added.</p>
    </form>
  )
}
