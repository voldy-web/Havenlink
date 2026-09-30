import { createContext } from 'react'

// The shared shopping cart. The provider is in CartProvider.jsx and pages
// read it with the useCart() hook (src/hooks/useCart.js).
export const CartContext = createContext(null)
