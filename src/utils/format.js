// Currency settings live here so the whole site can switch currency
// (or country) by editing these two lines.
const CURRENCY_SYMBOL = 'GH₵'
const LOCALE = 'en-GH'

// formatPrice(4500) -> "GH₵4,500"
export function formatPrice(amount) {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString(LOCALE)}`
}
