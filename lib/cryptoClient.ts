// Minimal Web Crypto helpers for client-side encryption
export async function deriveKey(password: string, salt: Uint8Array) {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  return key
}

export async function encryptJSON(key: CryptoKey, data: object) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)))
  return { ct: arrayBufferToBase64(ct), iv: arrayBufferToBase64(iv) }
}

export async function decryptJSON(key: CryptoKey, ctB64: string, ivB64: string) {
  const ct = base64ToArrayBuffer(ctB64)
  const iv = base64ToArrayBuffer(ivB64)
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  const txt = new TextDecoder().decode(dec)
  return JSON.parse(txt)
}

function arrayBufferToBase64(buf: ArrayBuffer | Uint8Array) {
  const bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer)
  let str = ''
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i])
  return btoa(str)
}

function base64ToArrayBuffer(b64: string) {
  const bin = atob(b64)
  const len = bin.length
  const arr = new Uint8Array(len)
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i)
  return arr.buffer
}
