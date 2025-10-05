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
  const { id } = req.query
  if (req.method === 'DELETE') {
    await VaultItem.deleteOne({ _id: id, owner: userId })
    return res.json({ ok: true })
  }
  if (req.method === 'PUT') {
    let { encrypted, iv, salt, meta } = req.body
    if (!encrypted || !iv) return res.status(400).json({ error: 'missing encrypted/iv' })
    // if salt wasn't provided, generate one server-side (defensive)
    if (!salt) {
      const rand = crypto.randomBytes(16)
      salt = rand.toString('base64')
      console.warn('Warning: client did not provide salt for update; server generated one')
    }
    try {
      const it = await VaultItem.findOneAndUpdate({ _id: id, owner: userId }, { encrypted, iv, salt, meta }, { new: true })
      return res.json(it)
    } catch (e: any) {
      console.error('Vault update failed:', e)
      return res.status(500).json({ error: 'update failed', details: e.message })
    }
  }
  res.status(405).end()
}
