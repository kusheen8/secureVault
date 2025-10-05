import { useEffect, useRef, useState } from 'react'
import { deriveKey, decryptJSON, encryptJSON } from '../lib/cryptoClient'

type Item = { _id: string; encrypted: string; iv: string; salt: string; meta?: any; createdAt?: string }

export default function VaultPage() {
  const [items, setItems] = useState<Item[]>([])
  const [q, setQ] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [master, setMaster] = useState('') // kept in memory only
  const keyCache = useRef<Map<string, CryptoKey>>(new Map())
  const [editing, setEditing] = useState<Item | null>(null)
  const titleRef = useRef<HTMLInputElement | null>(null)
  const userRef = useRef<HTMLInputElement | null>(null)
  const passRef = useRef<HTMLInputElement | null>(null)
  const urlRef = useRef<HTMLInputElement | null>(null)
  const notesRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => { fetchItems() }, [])

    const isLoggedIn = () => (typeof window !== 'undefined' ? !!localStorage.getItem('token') : false)

    function logout() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        setMaster('')
        keyCache.current.clear()
        window.location.href = '/auth'
      }
    }

  async function fetchItems() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      // user not logged in — guide them to auth
      alert('You must sign in to view your vault')
      if (typeof window !== 'undefined') window.location.href = '/auth'
      return
    }
    const res = await fetch('/api/vault', { headers: { Authorization: 'Bearer ' + token } })
    if (res.status === 401) {
      alert('Session expired or unauthorized. Please sign in again.')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/auth'
      }
      return
    }
    if (!res.ok) {
      console.error('Failed to fetch vault items', res.status)
      return
    }
    const j = await res.json()
    setItems(j)
  }

  function unlockSession() {
    // keep master in memory for the session; user will derive per-item keys when needed
    const pw = prompt('Enter your master password for this session (kept in memory only)') || ''
    setMaster(pw)
    keyCache.current.clear()
  }

  function startAdd() {
    setEditing({ _id: '', encrypted: '', iv: '', salt: '', meta: { title: '' } })
    // small timeout to focus
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  async function startEdit(it: Item) {
    if (!master) return alert('unlock session with master password first')
    // decrypt using its salt
    try {
      const saltStr = atob(it.salt)
      const saltArr = new Uint8Array(Array.from(saltStr).map(c => c.charCodeAt(0)))
      let key = keyCache.current.get(it._id)
      if (!key) {
        key = await deriveKey(master, saltArr)
        keyCache.current.set(it._id, key)
      }
      const plain = await decryptJSON(key, it.encrypted, it.iv)
      setEditing({ ...it, meta: { title: plain.title } })
      // after state updates, set inputs with a tiny delay
      setTimeout(() => {
        if (titleRef.current) titleRef.current.value = plain.title || ''
        if (userRef.current) userRef.current.value = plain.username || ''
        if (passRef.current) passRef.current.value = plain.password || ''
        if (urlRef.current) urlRef.current.value = plain.url || ''
        if (notesRef.current) notesRef.current.value = plain.notes || ''
      }, 50)
    } catch (e) {
      alert('decrypt failed — wrong master password?')
    }
  }

  async function saveItem() {
    if (!editing) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) return alert('login first')
    if (!master) return alert('unlock session with master password first')
    const title = titleRef.current?.value || ''
    const username = userRef.current?.value || ''
    const password = passRef.current?.value || ''
    const url = urlRef.current?.value || ''
    const notes = notesRef.current?.value || ''

    // generate per-item salt (guard for environments without Web Crypto)
  const cryptoObj: any = (typeof window !== 'undefined' && window.crypto) ? window.crypto : (typeof globalThis !== 'undefined' ? (globalThis as any).crypto : null)
  if (!cryptoObj || !cryptoObj.getRandomValues) return alert('Web Crypto API not available in this environment')
  const saltArr = cryptoObj.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(master, saltArr)
    const payload = { title, username, password, url, notes }
    const enc = await encryptJSON(key, payload)
    const body = { encrypted: enc.ct, iv: enc.iv, salt: btoa(String.fromCharCode(...saltArr)), meta: { title } }

    if (!editing._id) {
      // create
      await fetch('/api/vault', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type':'application/json' }, body: JSON.stringify(body) })
    } else {
      // update
      await fetch('/api/vault/' + editing._id, { method: 'PUT', headers: { Authorization: 'Bearer ' + token, 'Content-Type':'application/json' }, body: JSON.stringify(body) })
    }
    setEditing(null)
    // after changes, refresh list and clear cache (ids may have changed)
    await fetchItems()
    keyCache.current.clear()
  }

  async function delItem(id: string) {
    if (!confirm('Delete this item?')) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) return alert('login first')
    await fetch('/api/vault/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
    await fetchItems()
  }

  async function copyPwd(it: Item) {
    if (!master) return alert('unlock session with master password first')
    try {
      const saltStr = atob(it.salt)
      const saltArr = new Uint8Array(Array.from(saltStr).map(c => c.charCodeAt(0)))
      let key = keyCache.current.get(it._id)
      if (!key) {
        key = await deriveKey(master, saltArr)
        keyCache.current.set(it._id, key)
      }
      const plain = await decryptJSON(key, it.encrypted, it.iv)
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(plain.password)
      } else if (typeof document !== 'undefined') {
        // fallback copy for older browsers / insecure contexts
        const ta = document.createElement('textarea')
        ta.value = plain.password
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        try { document.execCommand('copy') } catch (e) { /* ignore */ }
        document.body.removeChild(ta)
      } else {
        return alert('Copy not available in this environment')
      }
      setCopiedId(it._id)
      setTimeout(() => setCopiedId(null), 10000)
    } catch (e) {
      alert('decrypt failed — wrong master password?')
    }
  }

  function filtered() {
    return items.filter(i => !q || JSON.stringify(i).toLowerCase().includes(q.toLowerCase()))
  }

  return (
    <div className="container">
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h2>Your Vault</h2>
        <div style={{display:'flex',gap:8}}>
          <button onClick={unlockSession} className="btn">Unlock</button>
          <button onClick={startAdd} className="btn primary">Add item</button>
          <button onClick={fetchItems} className="btn" disabled={!isLoggedIn()}>Refresh</button>
          <button onClick={logout} className="btn">Logout</button>
        </div>
      </header>

      <div className="card">
        <input className="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="vault-list">
          {filtered().map(it => (
            <li key={it._id} className="vault-item">
              <div>
                <div className="vault-title">{it.meta?.title || '—'}</div>
                <div className="vault-meta">{new Date((it.createdAt) || '').toLocaleString()}</div>
              </div>
              <div className="vault-actions">
                <button onClick={() => startEdit(it)} className="btn">Edit</button>
                <button onClick={() => copyPwd(it)} className="btn">{copiedId === it._id ? 'Copied (auto-clear)' : 'Copy'}</button>
                <button onClick={() => delItem(it._id)} className="btn danger">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {editing && (
        <div className="card form">
          <h3>{editing._id ? 'Edit' : 'Add'} item</h3>
          <input ref={titleRef} placeholder="Title" />
          <input ref={userRef} placeholder="Username" />
          <input ref={passRef} placeholder="Password" />
          <input ref={urlRef} placeholder="URL" />
          <textarea ref={notesRef} placeholder="Notes" />
          <div style={{display:'flex',gap:8}}>
            <button onClick={saveItem} className="btn primary">Save</button>
            <button onClick={() => setEditing(null)} className="btn">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
  
}
