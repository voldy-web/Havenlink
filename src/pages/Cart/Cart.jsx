import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import PaymentForm from '../../components/ui/PaymentForm'
import { useCart } from '../../hooks/useCart'
import { getProductsByIds } from '../../services/productService'
import { createOrder, deliveryFee, FREE_DELIVERY_OVER } from '../../services/orderService'
import { emptyPayment, validatePayment, paymentLabel } from '../../utils/payment'
import { longDate, startOfToday, toISO, fromISO } from '../../utils/dates'
import { formatPrice } from '../../utils/format'
import './Cart.css'

const windows = ['9:00 AM - 12:00 PM', '1:00 PM - 4:00 PM']
const emptyAddress = { name: '', phone: '', street: '', area: '', city: 'Accra', notes: '' }

// The next three delivery days, starting tomorrow (Sundays are skipped).
function deliveryDays() {
  const days = []
  const d = startOfToday()
  while (days.length < 3) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0) days.push(toISO(d))
  }
  return days
}

export default function Cart() {
  const { lines, subtotal, setQty, removeItem, clear } = useCart()
  const [products, setProducts] = useState({})
  const [address, setAddress] = useState(emptyAddress)
  const [days] = useState(deliveryDays)
  const [day, setDay] = useState(days[0])
  const [win, setWin] = useState(windows[1])
  const [payment, setPayment] = useState({ ...emptyPayment, method: 'momo' })
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState(null)

  // Load product details (name, photo) for the items in the cart.
  const ids = lines.map((l) => l.productId).join(',')
  useEffect(() => {
    let ignore = false
    getProductsByIds(ids ? ids.split(',').map(Number) : []).then((list) => {
      if (!ignore) setProducts(Object.fromEntries(list.map((p) => [p.id, p])))
    })
    return () => { ignore = true }
  }, [ids])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [order])

  const fee = deliveryFee(subtotal)
  const total = subtotal + fee
  const units = lines.reduce((sum, l) => sum + l.qty, 0)
  const setAddr = (patch) => setAddress((a) => ({ ...a, ...patch }))

  function validate() {
    const e = {}
    if (address.name.trim().length < 2) e.aname = 'Enter the name of the person receiving the order.'
    if (address.phone.replace(/\D/g, '').length < 9) e.aphone = 'Enter a phone number the delivery team can call.'
    if (address.street.trim().length < 4) e.astreet = 'Enter the street or house address.'
    if (address.area.trim().length < 2) e.aarea = 'Enter the area or neighbourhood.'
    return { ...e, ...validatePayment(payment) }
  }

  async function place(ev) {
    ev.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      document.querySelector('[aria-invalid="true"]')?.focus()
      return
    }
    setPlacing(true)
    // DEMO: pretend the payment takes a moment. A real payment provider
    // will be connected with the backend.
    await new Promise((resolve) => setTimeout(resolve, 1200))
    const saved = await createOrder({
      items: lines.map((l) => ({
        productId: l.productId,
        name: products[l.productId]?.name || 'Item',
        qty: l.qty,
        unitPrice: l.unitPrice,
        choices: l.choices,
      })),
      subtotal,
      deliveryFee: fee,
      total,
      address: { ...address },
      deliveryDate: day,
      deliveryWindow: win,
      // Only the method is kept. Card and phone details are never stored.
      paymentMethod: paymentLabel(payment),
      paid: payment.method !== 'cash',
    })
    clear()
    setPlacing(false)
    setOrder(saved)
  }

  // ---------- Order confirmed ----------
  if (order) {
    return (
      <section className="container cart cart--done">
        <span className="cart__done-icon"><Icon name="check" size={32} /></span>
        <h1>Order confirmed</h1>
        <p>Thank you, {order.address.name.split(' ')[0]}. We will deliver on {longDate(fromISO(order.deliveryDate))}, {order.deliveryWindow}.</p>

        <div className="cart-panel cart__receipt">
          <dl className="cart__list">
            <div><dt>Order number</dt><dd>{order.reference}</dd></div>
            <div><dt>Status</dt><dd>{order.status}</dd></div>
            <div><dt>Delivering to</dt><dd>{order.address.street}, {order.address.area}, {order.address.city}</dd></div>
            <div><dt>Payment</dt><dd>{order.paid ? `Paid with ${order.paymentMethod}` : `${formatPrice(order.total)} due on delivery`}</dd></div>
          </dl>
          <ul className="cart__receipt-items">
            {order.items.map((i) => (
              <li key={i.productId + JSON.stringify(i.choices)}>
                <span>{i.qty} x {i.name}{Object.values(i.choices || {}).length > 0 && <small> ({Object.values(i.choices).join(', ')})</small>}</span>
                <b>{formatPrice(i.qty * i.unitPrice)}</b>
              </li>
            ))}
            <li><span>Delivery</span><b>{order.deliveryFee ? formatPrice(order.deliveryFee) : 'FREE'}</b></li>
            <li className="is-total"><span>Total</span><b>{formatPrice(order.total)}</b></li>
          </ul>
        </div>

        <div className="cart__actions">
          <Button to="/orders">Track my order</Button>
          <Button to="/shop" variant="outline">Continue shopping</Button>
        </div>
      </section>
    )
  }

  // ---------- Empty cart ----------
  if (lines.length === 0) {
    return (
      <section className="container cart cart--empty">
        <span className="cart__done-icon"><Icon name="bag" size={32} /></span>
        <h1>Your cart is empty</h1>
        <p>Browse beds, couches, appliances and more, delivered to your new home.</p>
        <Button to="/shop">Browse the Shop</Button>
      </section>
    )
  }

  return (
    <div className="container cart">
      <p className="eyebrow">Checkout</p>
      <h1>Shopping Cart &amp; Delivery</h1>
      <span className="pay__demo cart__demo"><Icon name="shield" size={14} /> Demo mode: no real money is taken</span>

      <form className="cart__layout" onSubmit={place} noValidate>
        <div className="cart__main">
          {/* 1. Items */}
          <section className="cart-panel">
            <h2><span>1</span> Cart Items ({units})</h2>
            <ul className="cart-items">
              {lines.map((l) => {
                const p = products[l.productId]
                const options = Object.values(l.choices || {}).join(' · ')
                return (
                  <li key={l.key}>
                    {p && <Link to={`/shop/${p.id}`}><img src={p.image} alt="" /></Link>}
                    <div className="cart-items__info">
                      <h3>{p ? <Link to={`/shop/${p.id}`}>{p.name}</Link> : 'Item'}</h3>
                      {options && <p>{options}</p>}
                      <div className="cart-items__row">
                        <div className="qty qty--small" role="group" aria-label={`Quantity for ${p?.name || 'item'}`}>
                          <button type="button" aria-label="Decrease quantity" onClick={() => setQty(l.key, l.qty - 1)}><Icon name="minus" size={12} /></button>
                          <span>{l.qty}</span>
                          <button type="button" aria-label="Increase quantity" disabled={l.qty >= 10} onClick={() => setQty(l.key, l.qty + 1)}><Icon name="plus" size={12} /></button>
                        </div>
                        <button type="button" className="cart-items__remove" onClick={() => removeItem(l.key)}>
                          <Icon name="trash" size={14} /> Remove
                        </button>
                      </div>
                    </div>
                    <b className="cart-items__price">{formatPrice(l.qty * l.unitPrice)}</b>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* 2. Address */}
          <section className="cart-panel">
            <h2><span>2</span> Delivery Address</h2>
            <div className="cart-fields">
              <label>
                <span>Full name</span>
                <input value={address.name} onChange={(e) => setAddr({ name: e.target.value })} autoComplete="name" aria-invalid={Boolean(errors.aname)} />
                {errors.aname && <em>{errors.aname}</em>}
              </label>
              <label>
                <span>Phone number</span>
                <input type="tel" value={address.phone} onChange={(e) => setAddr({ phone: e.target.value })} placeholder="024 123 4567" autoComplete="tel" aria-invalid={Boolean(errors.aphone)} />
                {errors.aphone && <em>{errors.aphone}</em>}
              </label>
              <label className="wide">
                <span>Street / house address</span>
                <input value={address.street} onChange={(e) => setAddr({ street: e.target.value })} placeholder="House number, street, landmark" autoComplete="street-address" aria-invalid={Boolean(errors.astreet)} />
                {errors.astreet && <em>{errors.astreet}</em>}
              </label>
              <label>
                <span>Area / neighbourhood</span>
                <input value={address.area} onChange={(e) => setAddr({ area: e.target.value })} placeholder="e.g. East Legon" aria-invalid={Boolean(errors.aarea)} />
                {errors.aarea && <em>{errors.aarea}</em>}
              </label>
              <label>
                <span>City</span>
                <select value={address.city} onChange={(e) => setAddr({ city: e.target.value })}>
                  {['Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Other'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="wide">
                <span>Delivery notes (optional)</span>
                <textarea rows="2" value={address.notes} onChange={(e) => setAddr({ notes: e.target.value })} placeholder="Gate code, floor, best time to call…" />
              </label>
            </div>
          </section>

          {/* 3. Delivery day */}
          <section className="cart-panel">
            <h2><span>3</span> Delivery Day &amp; Time</h2>
            <div className="cart-days">
              {days.map((d, i) => (
                <button key={d} type="button" className={day === d ? 'is-active' : ''} aria-pressed={day === d} onClick={() => setDay(d)}>
                  <small>{i === 0 ? 'EARLIEST' : 'AVAILABLE'}</small>
                  <b>{fromISO(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</b>
                </button>
              ))}
            </div>
            <div className="cart-windows" role="radiogroup" aria-label="Delivery time">
              {windows.map((w) => (
                <label key={w} className={win === w ? 'is-active' : ''}>
                  <input type="radio" name="window" checked={win === w} onChange={() => setWin(w)} />
                  <Icon name="clock" size={16} /> {w}
                </label>
              ))}
            </div>
          </section>

          {/* 4. Payment */}
          <section className="cart-panel">
            <h2><span>4</span> Payment Method</h2>
            <PaymentForm value={payment} onChange={setPayment} errors={errors} allowCash />
          </section>
        </div>

        <aside className="cart__side">
          <section className="cart-panel">
            <div className="cart__side-head">
              <h2>Order Summary</h2>
              <small>{units} {units === 1 ? 'unit' : 'units'}</small>
            </div>
            <dl className="cart__lines">
              <div><dt>Items subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div>
                <dt>Delivery</dt>
                <dd className={fee === 0 ? 'is-free' : ''}>{fee === 0 ? 'FREE' : formatPrice(fee)}</dd>
              </div>
            </dl>
            {fee > 0 && (
              <p className="cart__hint">Add {formatPrice(FREE_DELIVERY_OVER - subtotal)} more for free delivery.</p>
            )}
            <div className="cart__total">
              <div><b>Order Total</b><small>Delivery included</small></div>
              <strong>{formatPrice(total)}</strong>
            </div>
            <button type="submit" className="cart__place" disabled={placing}>
              <Icon name="lock" size={16} />
              {placing ? 'Placing order…' : payment.method === 'cash' ? `Place Order (${formatPrice(total)} on delivery)` : `Pay ${formatPrice(total)} & Place Order`}
            </button>
            <p className="cart__terms">By ordering you agree to Haven Link's Terms of Service.</p>
          </section>
        </aside>
      </form>
    </div>
  )
}
