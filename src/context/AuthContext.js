import { createContext } from 'react'

// Who is signed in. Provider: AuthProvider.jsx. Use the useAuth() hook.
export const AuthContext = createContext(null)
