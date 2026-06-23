import { createContext, useContext, useState, useCallback } from 'react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const TK = 'kryonix_token'
const UK = 'kryonix_user'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TK))
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem(UK)) } catch { return null } })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const save = (t, u) => { localStorage.setItem(TK, t); localStorage.setItem(UK, JSON.stringify(u)); setToken(t); setUser(u) }
  const clear = () => { localStorage.removeItem(TK); localStorage.removeItem(UK); setToken(null); setUser(null) }

  const register = useCallback(async (email, username, password) => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, username, password }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Registration failed')
      if (d.requires_otp) return { ok: true, requires_otp: true, email, message: d.message }
      save(d.access_token, d.user)
      return { ok: true, requires_otp: false }
    } catch (e) { setError(e.message); return { ok: false, error: e.message } }
    finally { setLoading(false) }
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Login failed')
      if (d.requires_otp) return { ok: true, requires_otp: true, email, message: d.message }
      save(d.access_token, d.user)
      return { ok: true, requires_otp: false }
    } catch (e) { setError(e.message); return { ok: false, error: e.message } }
    finally { setLoading(false) }
  }, [])

  const verifyOtp = useCallback(async (email, otp, endpoint = '/auth/verify-otp') => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`${API}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Invalid OTP')
      save(d.access_token, d.user)
      return { ok: true }
    } catch (e) { setError(e.message); return { ok: false, error: e.message } }
    finally { setLoading(false) }
  }, [])

  const resendOtp = useCallback(async (email) => {
    try {
      await fetch(`${API}/auth/resend-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      return { ok: true }
    } catch { return { ok: false } }
  }, [])

  const logout = useCallback(() => { clear() }, [])

  return (
    <Ctx.Provider value={{ user, token, isAuthenticated: !!token && !!user, loading, error, setError, register, login, verifyOtp, resendOtp, logout, API }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error('useAuth outside AuthProvider'); return c }
