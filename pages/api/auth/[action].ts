import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connect } from '../../../lib/mongoose'
import User from '../../../models/User'
import devStore from '../../../lib/devStore'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query
  await connect()
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email+password required', message: 'Email and password are required' })
  if (action === 'signup') {
    if (!process.env.MONGODB_URI) {
      // use simple file-backed dev store
      const existing = await devStore.findUserByEmail(email)
  if (existing) return res.status(409).json({ error: 'exists', message: 'A user with that email already exists' })
      const hash = await bcrypt.hash(password, 10)
      const user = await devStore.createUser(email, hash)
      const token = jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET)
      return res.json({ token })
    }
    const existing = await User.findOne({ email })
  if (existing) return res.status(409).json({ error: 'exists', message: 'A user with that email already exists' })
    const hash = await bcrypt.hash(password, 10)
    const user = new User({ email, passwordHash: hash })
    await user.save()
    const token = jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET)
    return res.json({ token })
  }
  if (action === 'login') {
    if (!process.env.MONGODB_URI) {
      const user = await devStore.findUserByEmail(email)
      if (!user) return res.status(401).json({ error: 'invalid' })
      const ok = await bcrypt.compare(password, user.passwordHash)
      if (!ok) return res.status(401).json({ error: 'invalid' })
      const token = jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET)
      return res.json({ token })
    }
    const user = await User.findOne({ email })
  if (!user) return res.status(401).json({ error: 'invalid', message: 'Invalid email or password' })
    const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'invalid', message: 'Invalid email or password' })
    const token = jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET)
    return res.json({ token })
  }
  res.status(404).end()
}
