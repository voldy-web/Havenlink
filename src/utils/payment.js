// Helpers for the payment form. Nothing here talks to a payment provider;
// it only checks that what was typed looks valid.

// Luhn check: the standard test that catches mistyped card numbers.
export function isValidCardNumber(value) {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

// "4242424242424242" -> "4242 4242 4242 4242"
export const formatCardNumber = (value) =>
  value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()

// "0827" -> "08/27"
export function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

// True when MM/YY is a real month that has not passed yet.
export function isValidExpiry(value) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value)
  if (!match) return false
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return false
  const now = new Date()
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

// Checks the whole payment form. `value` is { method, momo, card }.
// Returns an object of error messages (empty when everything is valid).
export function validatePayment(value) {
  const e = {}
  if (value.method === 'momo') {
    if (value.momo.number.replace(/\D/g, '').length < 9) e.momo = 'Enter the mobile money number (for example 024 123 4567).'
  } else if (value.method === 'card') {
    if (value.card.name.trim().length < 2) e.name = 'Enter the name on the card.'
    if (!isValidCardNumber(value.card.number)) e.number = 'Enter a valid card number.'
    if (!isValidExpiry(value.card.expiry)) e.expiry = 'Enter a valid expiry date (MM/YY).'
    if (!/^\d{3,4}$/.test(value.card.cvc)) e.cvc = 'Enter the 3 or 4 digit security code.'
  }
  return e
}

export const momoNetworks = ['MTN MoMo', 'Vodafone Cash', 'AirtelTigo Money']

export const emptyPayment = {
  method: 'momo',
  momo: { network: momoNetworks[0], number: '' },
  card: { name: '', number: '', expiry: '', cvc: '' },
}

// The name saved with an order: only the method, never card or phone details.
export const paymentLabel = (value) =>
  value.method === 'momo' ? value.momo.network : value.method === 'card' ? 'Card' : 'Pay on delivery'
