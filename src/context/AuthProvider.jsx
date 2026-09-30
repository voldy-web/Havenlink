import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext'
import { getSessionUser, registerAccount, signIn, signOut } from '../services/authService'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(getSessionUser)

  // Each returns { error } or { user }, so forms can show the message.
  const register = useCallback(async (details) => {
    const result = await registerAccount(details)
    if (result.user) setUser(result.user)
    return result
  }, [])

  const login = useCallback(async (email) => {
    const result = await signIn(email)
    if (result.user) setUser(result.user)
    return result
  }, [])

  const logout = useCallback(() => {
    signOut()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, register, login, logout }), [user, register, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
