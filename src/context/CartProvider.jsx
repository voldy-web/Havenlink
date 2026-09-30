import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from './CartContext'

const STORAGE_KEY = 'havenlink_cart'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

// One cart line: { key, productId, qty, choices: { Finish: 'Walnut Stain' }, unitPrice }
// Two lines are the same item when the product AND chosen options match.
const lineKey = (productId, choices) => `${productId}:${JSON.stringify(choices || {})}`

export default function CartProvider({ children }) {
  const [lines, setLines] = useState(load)

  // Keep the cart between visits.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // Storage can be blocked. The cart still works until the tab closes.
    }
  }, [lines])

  const addItem = useCallback((productId, unitPrice, qty = 1, choices = {}) => {
    const key = lineKey(productId, choices)
    setLines((current) => {
      const existing = current.find((l) => l.key === key)
      if (existing) return current.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, 10) } : l))
      return [...current, { key, productId, qty, choices, unitPrice }]
    })
  }, [])

  const setQty = useCallback((key, qty) => {
    setLines((current) =>
      qty <= 0 ? current.filter((l) => l.key !== key) : current.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 10) } : l)),
    )
  }, [])

  const removeItem = useCallback((key) => setLines((current) => current.filter((l) => l.key !== key)), [])
  const clear = useCallback(() => setLines([]), [])

  const value = useMemo(() => ({
    lines,
    count: lines.reduce((sum, l) => sum + l.qty, 0),
    subtotal: lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0),
    addItem,
    setQty,
    removeItem,
    clear,
  }), [lines, addItem, setQty, removeItem, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
