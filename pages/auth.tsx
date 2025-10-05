import { useEffect, useState } from 'react'
import Router from 'next/router'

export default function AuthPage() {
  const [devStore, setDevStore] = useState(false)
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // if already logged-in, redirect to the generator (home)
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (t) Router.replace('/')
    } catch(e){}
    // detect whether server is using the file-backed dev store
    try {
      fetch('/api/auth/info').then(r=>r.json()).then(j=>{ if (j && j.devStore) setDevStore(true) }).catch(()=>{})
    }catch(e){}
  }, [])

  async function submit() {
    setLoading(true)
    const action = mode === 'register' ? 'signup' : 'login'
    try {
      const res = await fetch(`/api/auth/${action}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) })
      const j = await res.json()
      if (j.token) {
        localStorage.setItem('token', j.token)
        Router.replace('/')
      } else {
        const msg = j && (j.message || j.error) ? (j.message || j.error) : JSON.stringify(j)
        alert('Error: ' + msg)
      }
    } catch (e) {
      alert('Network error')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      {devStore && (
        <div style={{background:'#fffbdd',padding:8,border:'1px solid #f0e68c',marginBottom:12,textAlign:'center'}}>
          Running in DEV mode: using local file-backed auth store (.data/dev-users.json)
        </div>
      )}
      <div className="auth-card card">
        <div className="auth-title">Secure Vault</div>
        <div className="auth-sub">Generate and store passwords locally encrypted — privacy-first.</div>
        <div className="tabs">
          <div className={`tab ${mode==='login'?'active':''}`} onClick={() => setMode('login')}>Sign in</div>
          <div className={`tab ${mode==='register'?'active':''}`} onClick={() => setMode('register')}>Register</div>
        </div>

        <div className="auth-field">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" />
        </div>
        <div className="auth-field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="choose a strong password" />
        </div>

        <div className="auth-actions">
          <button className="btn ghost" onClick={() => { setEmail(''); setPassword('') }}>Clear</button>
          <button className="btn primary" onClick={submit} disabled={loading}>{loading ? 'Please wait...' : (mode==='login'?'Sign in':'Create account')}</button>
        </div>
      </div>
    </div>
  )
}
