import { useEffect, useState } from 'react'
import Link from 'next/link'
import { deriveKey, encryptJSON } from '../lib/cryptoClient'

type VaultItem = {
  _id?: string
  title: string
  username: string
  password: string
  url?: string
  notes?: string
}

function randomPassword(length: number, opts: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean; excludeLookAlike: boolean }) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // removed I and O
  const lower = 'abcdefghijkmnopqrstuvwxyz' // removed l
  const numbers = '23456789' // removed 0,1
  const symbols = '!@#$%^&*()-_=+[]{};:,.<>?'
  let chars = ''
  if (opts.upper) chars += upper
  if (opts.lower) chars += lower
  if (opts.numbers) chars += numbers
  if (opts.symbols) chars += symbols
  if (!chars) return ''
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export default function Home() {
  const [length, setLength] = useState(16)
  const [upper, setUpper] = useState(true)
  const [lower, setLower] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [excludeLook, setExcludeLook] = useState(true)
  const [generated, setGenerated] = useState('')

  useEffect(() => {
    setGenerated(randomPassword(length, { upper, lower, numbers, symbols, excludeLookAlike: excludeLook }))
  }, [])

  useEffect(() => {
    // require login for the dashboard
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!t) window.location.href = '/auth'
    } catch (e) {}
  }, [])

  return (
    <div className="container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h1 style={{margin:0}}>Secure Vault</h1>
        <div style={{display:'flex',gap:8}}>
          <Link href="/vault" className="btn">Open Vault</Link>
          <a className="btn" href="#" onClick={() => { localStorage.removeItem('token'); window.location.href='/auth' }}>Logout</a>
        </div>
      </div>

      <section className="card">
        <h2 style={{marginTop:0}}>Password Generator</h2>
        <div className="row">
          <label style={{minWidth:120}}>Length: {length}</label>
          <input type="range" min={6} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} />
        </div>
        <div className="row">
          <label><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> Upper</label>
          <label><input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} /> Lower</label>
          <label><input type="checkbox" checked={numbers} onChange={(e) => setNumbers(e.target.checked)} /> Numbers</label>
          <label><input type="checkbox" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} /> Symbols</label>
        </div>
        <div className="row" style={{marginTop:16}}>
          <button onClick={() => setGenerated(randomPassword(length, { upper, lower, numbers, symbols, excludeLookAlike: excludeLook } ))} className="btn">Generate</button>
          <input readOnly value={generated} style={{width: '60%'}} />
          <button className="btn primary" onClick={async () => {
            if (!generated) return alert('Generate a password first')
            const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null
            if (!token) return window.location.href = '/auth'
            const title = prompt('Title for this password', 'Generated password') || 'Generated password'
            const username = prompt('Username (optional)', '') || ''
            const master = prompt('Enter your master password for this save (kept in memory only)') || ''
            if (!master) return alert('Master password required to encrypt')
            const cryptoObj: any = (typeof window !== 'undefined' && window.crypto) ? window.crypto : (typeof globalThis !== 'undefined' ? (globalThis as any).crypto : null)
            if (!cryptoObj || !cryptoObj.getRandomValues) return alert('Web Crypto API not available')
            try {
              const saltArr = cryptoObj.getRandomValues(new Uint8Array(16))
              const key = await deriveKey(master, saltArr)
              const payload = { title, username, password: generated, url: '', notes: '' }
              const enc = await encryptJSON(key, payload)
              const body = { encrypted: enc.ct, iv: enc.iv, salt: btoa(String.fromCharCode(...saltArr)), meta: { title } }
              const res = await fetch('/api/vault', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
              if (res.ok) {
                alert('Saved to vault')
                window.location.href = '/vault'
              } else {
                const j = await res.json()
                alert('Save failed: ' + JSON.stringify(j))
              }
            } catch (e) {
              console.error(e)
              alert('Error encrypting or saving: ' + (e as any)?.message)
            }
          }}>Save to Vault</button>
        </div>
      </section>
    </div>
  )
}

// NOTE: removed server-side redirect to /auth because the app stores the
// auth token in localStorage (client-side). Keeping a server redirect here
// caused an immediate redirect loop after sign-in. The page enforces auth
// client-side and will send users to `/auth` when no token is present.
