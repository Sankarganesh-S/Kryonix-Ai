import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState(1) // 1=email, 2=otp, 3=newpass
  const [email, setEmail] = useState('')
  const [digits, setDigits] = useState(['','','','','',''])
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const refs = useRef([])

  const startCooldown = () => {
    setResendCooldown(60)
    const t = setInterval(() => setResendCooldown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
  }

  // Step 1 — send OTP
  const sendOtp = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const r = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Failed')
      setStep(2); startCooldown()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  // Step 2 — verify OTP
  const handleDigit = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const nd = [...digits]; nd[i] = val.slice(-1); setDigits(nd)
    if (val && i < 5) refs.current[i+1]?.focus()
    if (nd.every(d => d) && val) verifyOtp(nd.join(''))
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i-1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (p.length === 6) { setDigits(p.split('')); verifyOtp(p) }
  }

  const verifyOtp = async (otp) => {
    setLoading(true); setError('')
    try {
      const r = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp })
      })
      const d = await r.json()
      // If verify-otp succeeds it logs in — but for forgot password we just move to step 3
      if (r.ok) setStep(3)
      else throw new Error(d.detail || 'Invalid OTP')
    } catch (e) { setError(e.message); setDigits(['','','','','','']); refs.current[0]?.focus() }
    finally { setLoading(false) }
  }

  const handleResend = async () => {
    await fetch(`${API}/auth/forgot-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    startCooldown()
    setError(''); setDigits(['','','','','',''])
    refs.current[0]?.focus()
  }

  // Step 3 — reset password
  const resetPassword = async (e) => {
    e.preventDefault()
    setError('')
    if (newPass !== confirmPass) { setError('Passwords do not match'); return }
    if (newPass.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const r = await fetch(`${API}/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: digits.join(''), new_password: newPass })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Failed to reset password')
      setSuccess('Password reset! Redirecting...')
      // Save token and redirect
      localStorage.setItem('kryonix_token', d.access_token)
      localStorage.setItem('kryonix_user', JSON.stringify(d.user))
      setTimeout(() => navigate('/chat'), 1500)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-bg">
      <div className="auth-glow"/>
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Sparkles size={22}/></div>
          <span className="auth-logo-text">Kryonix AI</span>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['Email','Verify OTP','New Password'].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 3, borderRadius: 4, background: i < step ? '#7c6ef5' : 'var(--border)', marginBottom: 4, transition: 'background .3s' }}/>
              <span style={{ fontSize: 11, color: i < step ? '#a78bfa' : 'var(--muted)' }}>{s}</span>
            </div>
          ))}
        </div>

        {error && <div className="auth-alert"><AlertCircle size={15}/><span>{error}</span></div>}
        {success && <div className="auth-success"><CheckCircle size={15}/><span>{success}</span></div>}

        {/* Step 1 — Email */}
        {step === 1 && (
          <>
            <h1 className="auth-heading">Forgot password?</h1>
            <p className="auth-sub">Enter your email and we'll send you an OTP</p>
            <form onSubmit={sendOtp} className="auth-form" style={{ marginTop: 24 }}>
              <div className="auth-field">
                <label className="auth-label">Email address</label>
                <div className="auth-input-wrap">
                  <Mail size={15} className="auth-ico"/>
                  <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required autoFocus/>
                </div>
              </div>
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? <span className="auth-spinner"/> : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(124,110,245,.12)', border: '1px solid rgba(124,110,245,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShieldCheck size={26} color="#7c6ef5"/>
              </div>
              <h1 className="auth-heading">Enter OTP</h1>
              <p className="auth-sub">Sent to <strong style={{ color: '#a78bfa' }}>{email}</strong></p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input key={i} ref={el => refs.current[i] = el}
                  type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  style={{ width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 700, fontFamily: 'monospace',
                    background: d ? 'rgba(124,110,245,.12)' : 'var(--bg3)',
                    border: `2px solid ${d ? '#7c6ef5' : 'var(--border)'}`,
                    borderRadius: 12, color: 'var(--text)', outline: 'none', transition: 'all .15s' }}
                />
              ))}
            </div>
            <button onClick={() => verifyOtp(digits.join(''))} disabled={digits.some(d => !d) || loading} className="auth-btn" style={{ width: '100%' }}>
              {loading ? <span className="auth-spinner"/> : 'Verify OTP'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Didn't receive it?</span>
              <button onClick={handleResend} disabled={resendCooldown > 0}
                style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? 'var(--muted)' : '#a78bfa', fontSize: 13, fontWeight: 600, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={12}/>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
              </button>
            </div>
          </>
        )}

        {/* Step 3 — New Password */}
        {step === 3 && (
          <>
            <h1 className="auth-heading">Set new password</h1>
            <p className="auth-sub">Choose a strong password for your account</p>
            <form onSubmit={resetPassword} className="auth-form" style={{ marginTop: 24 }}>
              <div className="auth-field">
                <label className="auth-label">New password</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-ico"/>
                  <input className="auth-input" type={showPass ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 6 characters" required/>
                  <button type="button" className="auth-eye" onClick={() => setShowPass(p => !p)}>
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Confirm password</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-ico"/>
                  <input className="auth-input" type={showPass ? 'text' : 'password'} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Repeat password" required/>
                </div>
              </div>
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? <span className="auth-spinner"/> : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <p className="auth-footer" style={{ marginTop: 20 }}>
          Remember it? <Link to="/login" className="auth-link">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
