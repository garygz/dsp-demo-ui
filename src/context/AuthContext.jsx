import { createContext, useContext, useEffect, useState } from 'react'
import { ENDPOINTS } from '../api/endpoints'

const AuthContext = createContext(null)

const isLocalhost = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const restoreSession = async () => {
      const stored = sessionStorage.getItem('user')
      if (stored) {
        setUser(JSON.parse(stored))
        setLoading(false)
        return
      }

      if (isLocalhost) {
        try {
          const res = await fetch(ENDPOINTS.DEV_LOGIN)
          if (res.ok) {
            const { token } = await res.json()
            const devUser = { email: 'test@test.com', name: 'test', token }
            sessionStorage.setItem('user', JSON.stringify(devUser))
            setUser(devUser)
          }
        } catch {
          // bypass unavailable, fall through to login screen
        }
      }

      setLoading(false)
    }
    restoreSession()
  }, [])

  async function login(email, password) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error('Invalid credentials')
      const { token } = await res.json()
      const loggedInUser = { email, name: email.split('@')[0], token }
      // GG For a demo/internal tool sessionStorage is acceptable,
      // but for anything customer-facing HttpOnly cookies are the standard (required)
      // TSL on endpoints is required (HTTPS)
      sessionStorage.setItem('user', JSON.stringify(loggedInUser))
      setUser(loggedInUser)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    sessionStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
