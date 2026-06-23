import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Sparkles, Mail, Lock, User, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const { register, loading, error, setError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e']

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    const r = await register(email.trim(), username.trim(), password)
    if (r.ok) {
      if (r.requires_otp) navigate('/otp', { state: { email: r.email, purpose: 'register' } })
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
        <h1 className="auth-heading">Create account</h1>
        <p className="auth-sub">Start chatting with your own AI — free forever</p>

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
            <label className="auth-label">Username</label>
            <div className="auth-input-wrap">
              <User size={15} className="auth-ico"/>
              <input className="auth-input" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="yourname" required minLength={3}/>
            </div>
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <Lock size={15} className="auth-ico"/>
              <input className="auth-input" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required/>
              <button type="button" className="auth-eye" onClick={() => setShowPass(p => !p)}>
                {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
            {password.length > 0 && (
              <div className="auth-strength">
                <div className="auth-strength-bar">
                  {[1,2,3].map(i => (
                    <div key={i} className="auth-strength-seg" style={{ background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,.1)' }}/>
                  ))}
                </div>
                <span style={{ color: strengthColor[strength], fontSize: 12 }}>{strengthLabel[strength]}</span>
              </div>
            )}
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="auth-spinner"/> : 'Create account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
      </div>
    </div>
  )
}
