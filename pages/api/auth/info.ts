import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const usingDevStore = !process.env.MONGODB_URI
  res.json({ devStore: usingDevStore })
}
