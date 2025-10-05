import { useState } from 'react'
import { deriveKey, encryptJSON, decryptJSON } from '../lib/cryptoClient'

export default function Demo() {
  const [password, setPassword] = useState('masterpassword')
  const [title, setTitle] = useState('Example')
  const [username, setUsername] = useState('user@example.com')
  const [secret, setSecret] = useState('secret123')
  const [last, setLast] = useState('')

  async function save() {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const key = await deriveKey(password, salt)
    const res = await encryptJSON(key, { title, username, password: secret })
    // send to /api/vault with Authorization
    setLast(JSON.stringify(res))
  }

  return (
    <div style={{padding:20}}>
      <h2>Demo encrypt</h2>
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="master password" />
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" />
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
      <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="secret" />
      <div><button onClick={save}>Encrypt & pretend save</button></div>
      <pre>{last}</pre>
    </div>
  )
}
