import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/global.css'
import App from './App.jsx'
import CartProvider from './context/CartProvider'
import SavedProvider from './context/SavedProvider'
import AuthProvider from './context/AuthProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter turns on page navigation without full reloads. */}
    <BrowserRouter>
      {/* CartProvider keeps the shopping cart available on every page. */}
      <CartProvider>
        <SavedProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SavedProvider>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
)
