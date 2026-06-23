import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Sparkles, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login, loading, error, setError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    const r = await login(email.trim(), password)
    if (r.ok) {
      if (r.requires_otp) navigate('/otp', { state: { email: r.email, purpose: 'login' } })
      else navigate('/chat')
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-glow"/>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Sparkles size={22}/></div>
          <span className="auth-logo-text">Kryonix AI</span>
        </div>
        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-sub">Sign in to your personal AI assistant</p>

        {error && <div className="auth-alert"><AlertCircle size={15}/><span>{error}</span></div>}

        <form onSubmit={submit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={15} className="auth-ico"/>
              <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required autoFocus/>
            </div>
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <Lock size={15} className="auth-ico"/>
              <input className="auth-input" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required/>
              <button type="button" className="auth-eye" onClick={() => setShowPass(p => !p)}>
                {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>

          {/* Forgot password link */}
          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <Link to="/forgot-password" className="auth-link" style={{ fontSize: 13 }}>Forgot password?</Link>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="auth-spinner"/> : 'Sign in'}
          </button>
        </form>
        <p className="auth-footer">No account? <Link to="/register" className="auth-link">Create one free</Link></p>
      </div>
    </div>
  )
}
