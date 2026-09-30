// Orders. Today they are saved in the browser (localStorage); when the
// backend exists these functions will call the API instead. Card and phone
// payment details are never stored, only the payment method.
import { apiEnabled, apiOrThrow } from './api'
const ORDERS_KEY = 'havenlink_orders'

// Delivery charge rules (mock). Free above the threshold.
export const DELIVERY_FEE = 80
export const FREE_DELIVERY_OVER = 3000

export const deliveryFee = (subtotal) => (subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE)

// The four stages every order moves through.
export const orderStages = [
  { id: 'Confirmed', text: 'We have your order and are getting it ready.' },
  { id: 'Packed', text: 'Your items are packed and waiting for the delivery team.' },
  { id: 'Out for Delivery', text: 'The delivery team is on the way to you.' },
  { id: 'Delivered', text: 'Your order has arrived. Enjoy your new items!' },
]

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []
  } catch {
    return []
  }
}

async function demoCreateOrder(details) {
  const order = {
    ...details,
    reference: `HL-O-${Date.now().toString().slice(-6)}`,
    status: 'Confirmed',
    history: [{ status: 'Confirmed', at: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...readAll()]))
  } catch {
    // Storage can be blocked (private browsing). The confirmation still shows.
  }
  return order
}

async function demoGetMyOrders() {
  return readAll()
}

// DEMO ONLY: moves an order to its next stage (the vendor side is not built yet).
async function demoAdvanceOrder(reference) {
  const order = orderStages.map((s) => s.id)
  const orders = readAll().map((o) => {
    if (o.reference !== reference) return o
    const next = order[order.indexOf(o.status) + 1]
    if (!next) return o
    return { ...o, status: next, history: [...(o.history || []), { status: next, at: new Date().toISOString() }] }
  })
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  } catch {
    // Storage blocked: the change is not saved.
  }
  return orders
}

// ---- What the pages use: the real API when connected, otherwise the browser demo ----
export const createOrder = (details) =>
  apiEnabled ? apiOrThrow('/orders', { method: 'POST', body: details }).then((d) => d.order) : demoCreateOrder(details)

export const getMyOrders = () =>
  apiEnabled ? apiOrThrow('/orders').then((d) => d.orders) : demoGetMyOrders()

export async function advanceOrder(reference) {
  if (!apiEnabled) return demoAdvanceOrder(reference)
  await apiOrThrow(`/orders/${reference}/advance`, { method: 'PATCH' })
  return getMyOrders()
}
