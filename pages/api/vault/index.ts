import type { NextApiRequest, NextApiResponse } from 'next'
import { connect } from '../../../lib/mongoose'
import VaultItem from '../../../models/VaultItem'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

async function getUserIdFromReq(req: NextApiRequest) {
  const h = req.headers.authorization
  if (!h) return null
  const m = h.split(' ')
  if (m[0] !== 'Bearer') return null
  try {
    const p: any = jwt.verify(m[1], JWT_SECRET)
    return p.sub
  } catch (e) {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect()
  const userId = await getUserIdFromReq(req)
  if (!userId) return res.status(401).json({ error: 'unauth' })
  if (req.method === 'GET') {
    const items = await VaultItem.find({ owner: userId }).sort({ createdAt: -1 })
    return res.json(items)
  }
  if (req.method === 'POST') {
    let { encrypted, iv, salt, meta } = req.body
    if (!encrypted || !iv) return res.status(400).json({ error: 'missing encrypted/iv' })
    // defensively generate a salt on the server if the client failed to send one
    if (!salt) {
  const rand = crypto.randomBytes(16)
  salt = rand.toString('base64')
      console.warn('Warning: client did not provide salt; server generated one')
    }
    try {
      const it = new VaultItem({ owner: userId, encrypted, iv, salt, meta })
      await it.save()
      return res.json(it)
    } catch (e: any) {
      console.error('Vault save failed:', e)
      return res.status(500).json({ error: 'save failed', details: e.message })
    }
  }
  res.status(405).end()
}
