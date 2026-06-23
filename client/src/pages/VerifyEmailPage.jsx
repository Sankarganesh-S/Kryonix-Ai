import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, Sparkles } from 'lucide-react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return }
    fetch(`${API}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => { if (d.verified) { setStatus('success'); setMessage(d.message) } else { setStatus('error'); setMessage(d.detail || 'Verification failed') } })
      .catch(() => { setStatus('error'); setMessage('Network error. Try again.') })
  }, [])

  return (
    <div className="auth-bg">
      <div className="auth-glow"/>
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo" style={{ justifyContent: 'center' }}>
          <div className="auth-logo-icon"><Sparkles size={22}/></div>
          <span className="auth-logo-text">Kryonix AI</span>
        </div>
        {status === 'loading' && (<><Loader size={40} className="spin" style={{ margin: '24px auto', color: '#7c6ef5' }}/><p>Verifying your email...</p></>)}
        {status === 'success' && (<><CheckCircle size={48} style={{ color: '#22c55e', margin: '16px auto' }}/><h2 style={{ color: '#22c55e' }}>Email Verified!</h2><p style={{ color: '#a1a1aa' }}>{message}</p><Link to="/chat" className="auth-btn" style={{ display: 'inline-block', marginTop: 20, textDecoration: 'none' }}>Start Chatting →</Link></>)}
        {status === 'error' && (<><XCircle size={48} style={{ color: '#ef4444', margin: '16px auto' }}/><h2 style={{ color: '#ef4444' }}>Verification Failed</h2><p style={{ color: '#a1a1aa' }}>{message}</p><Link to="/login" className="auth-link" style={{ display: 'block', marginTop: 16 }}>Back to login</Link></>)}
      </div>
    </div>
  )
}
