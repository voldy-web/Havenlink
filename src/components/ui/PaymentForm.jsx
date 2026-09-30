import Icon from './Icon'
import { formatCardNumber, formatExpiry, momoNetworks } from '../../utils/payment'
import './PaymentForm.css'

// Payment method picker with its fields. It is "controlled": the page
// owns `value` ({ method, momo, card }) and `errors`, so the page can
// validate it (see validatePayment in utils/payment.js) when submitting.
// allowCash adds a "Pay on delivery" choice (used by the shop).
export default function PaymentForm({ value, onChange, errors = {}, allowCash = false }) {
  const { method, momo, card } = value
  const set = (patch) => onChange({ ...value, ...patch })

  return (
    <>
      <div className="methods" role="radiogroup" aria-label="Payment method">
        <label className={method === 'momo' ? 'is-active' : ''}>
          <input type="radio" name="method" checked={method === 'momo'} onChange={() => set({ method: 'momo' })} />
          <span><Icon name="phone" size={18} /></span>
          <div><b>Mobile Money</b><small>MTN MoMo, Vodafone Cash, AirtelTigo Money</small></div>
        </label>
        <label className={method === 'card' ? 'is-active' : ''}>
          <input type="radio" name="method" checked={method === 'card'} onChange={() => set({ method: 'card' })} />
          <span><Icon name="card" size={18} /></span>
          <div><b>Credit / Debit Card</b><small>Visa or Mastercard</small></div>
        </label>
        {allowCash && (
          <label className={method === 'cash' ? 'is-active' : ''}>
            <input type="radio" name="method" checked={method === 'cash'} onChange={() => set({ method: 'cash' })} />
            <span><Icon name="bag" size={18} /></span>
            <div><b>Pay on Delivery</b><small>Pay the delivery team when your order arrives</small></div>
          </label>
        )}
      </div>

      {method === 'momo' && (
        <div className="pay-fields">
          <label>
            <span>Network</span>
            <select value={momo.network} onChange={(e) => set({ momo: { ...momo, network: e.target.value } })}>
              {momoNetworks.map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
          <label>
            <span>Mobile money number</span>
            <input
              type="tel"
              inputMode="tel"
              value={momo.number}
              onChange={(e) => set({ momo: { ...momo, number: e.target.value } })}
              placeholder="024 123 4567"
              aria-invalid={Boolean(errors.momo)}
            />
            {errors.momo && <em>{errors.momo}</em>}
          </label>
          <p className="pay-hint">You will be asked to approve the payment on your phone.</p>
        </div>
      )}

      {method === 'card' && (
        <div className="pay-fields">
          <label className="wide">
            <span>Cardholder name</span>
            <input
              value={card.name}
              onChange={(e) => set({ card: { ...card, name: e.target.value } })}
              autoComplete="cc-name"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <em>{errors.name}</em>}
          </label>
          <label className="wide">
            <span>Card number</span>
            <input
              inputMode="numeric"
              value={card.number}
              onChange={(e) => set({ card: { ...card, number: formatCardNumber(e.target.value) } })}
              placeholder="0000 0000 0000 0000"
              autoComplete="cc-number"
              aria-invalid={Boolean(errors.number)}
            />
            {errors.number && <em>{errors.number}</em>}
          </label>
          <label>
            <span>Expiry date</span>
            <input
              inputMode="numeric"
              value={card.expiry}
              onChange={(e) => set({ card: { ...card, expiry: formatExpiry(e.target.value) } })}
              placeholder="MM/YY"
              autoComplete="cc-exp"
              aria-invalid={Boolean(errors.expiry)}
            />
            {errors.expiry && <em>{errors.expiry}</em>}
          </label>
          <label>
            <span>Security code (CVC)</span>
            <input
              inputMode="numeric"
              value={card.cvc}
              onChange={(e) => set({ card: { ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) } })}
              autoComplete="cc-csc"
              aria-invalid={Boolean(errors.cvc)}
            />
            {errors.cvc && <em>{errors.cvc}</em>}
          </label>
          <p className="pay-hint">Demo: try card 4242 4242 4242 4242 with any future date and any code.</p>
        </div>
      )}

      {method === 'cash' && (
        <p className="pay-hint pay-hint--cash">
          Have the exact amount ready. You can pay by cash or mobile money when the order arrives.
        </p>
      )}
    </>
  )
}
