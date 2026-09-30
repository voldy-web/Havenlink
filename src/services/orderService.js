// Orders. Today they are saved in the browser (localStorage); when the
// backend exists these functions will call the API instead. Card and phone
// payment details are never stored, only the payment method.
const ORDERS_KEY = 'havenlink_orders'

// Delivery charge rules (mock). Free above the threshold.
export const DELIVERY_FEE = 80
export const FREE_DELIVERY_OVER = 3000

export const deliveryFee = (subtotal) => (subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE)

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []
  } catch {
    return []
  }
}

export async function createOrder(details) {
  const order = {
    ...details,
    reference: `HL-O-${Date.now().toString().slice(-6)}`,
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...readAll()]))
  } catch {
    // Storage can be blocked (private browsing). The confirmation still shows.
  }
  return order
}

export async function getMyOrders() {
  return readAll()
}
