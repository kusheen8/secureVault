import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  // Warn but do not throw during build; DB operations will be skipped at runtime
  console.warn('MONGODB_URI not set; DB will not connect in dev')
}

let cached: { conn: typeof mongoose | null } = { conn: null }

export async function connect() {
  if (cached.conn) return cached.conn

  if (!MONGODB_URI) {
    // Return mongoose instance even if not connected so imports don't fail
    return mongoose as unknown as typeof mongoose
  }

  const conn = await mongoose.connect(MONGODB_URI)
  cached.conn = conn
  return conn
}
