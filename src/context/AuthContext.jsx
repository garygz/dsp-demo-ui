import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const restoreSession = () => {
      const stored = sessionStorage.getItem('user')
      if (stored) setUser(JSON.parse(stored))
      setLoading(false)
    }
    restoreSession()
  }, [])

  async function login(email, password) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://localhost:8080/auth/login', {
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
