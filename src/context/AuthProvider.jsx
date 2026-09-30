import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext'
import { loadSession, registerAccount, signIn, signOut } from '../services/authService'
import { apiEnabled } from '../services/api'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // True while we check (with the server) whether a saved login is still valid.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    loadSession().then((u) => {
      if (ignore) return
      setUser(u)
      setLoading(false)
    })
    return () => { ignore = true }
  }, [])

  // Each returns { error } or { user }, so forms can show the message.
  const register = useCallback(async (details) => {
    const result = await registerAccount(details)
    if (result.user) setUser(result.user)
    return result
  }, [])

  const login = useCallback(async (email, password) => {
    const result = await signIn(email, password)
    if (result.user) setUser(result.user)
    return result
  }, [])

  const logout = useCallback(() => {
    signOut()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, demo: !apiEnabled, register, login, logout }), [user, loading, register, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
