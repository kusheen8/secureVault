import fs from 'fs'
import path from 'path'

const DIR = path.join(process.cwd(), '.data')
const FILE = path.join(DIR, 'dev-users.json')

type DevUser = { _id: string, email: string, passwordHash: string, createdAt: string, updatedAt: string }

async function ensureFile() {
  try {
    await fs.promises.mkdir(DIR, { recursive: true })
    await fs.promises.access(FILE, fs.constants.F_OK).catch(async () => {
      await fs.promises.writeFile(FILE, '[]', 'utf8')
    })
  } catch (e) {
    // ignore
  }
}

async function readAll(): Promise<DevUser[]> {
  await ensureFile()
  const raw = await fs.promises.readFile(FILE, 'utf8')
  try {
    const arr = JSON.parse(raw || '[]')
    if (Array.isArray(arr)) return arr
  } catch (e) {}
  return []
}

async function writeAll(users: DevUser[]) {
  await ensureFile()
  await fs.promises.writeFile(FILE, JSON.stringify(users, null, 2), 'utf8')
}

export async function findUserByEmail(email: string): Promise<DevUser | null> {
  const users = await readAll()
  return users.find(u => u.email === email) || null
}

export async function createUser(email: string, passwordHash: string) {
  const users = await readAll()
  const now = new Date().toISOString()
  const user: DevUser = { _id: String(Date.now()), email, passwordHash, createdAt: now, updatedAt: now }
  users.push(user)
  await writeAll(users)
  return user
}

export async function clearAll() {
  await writeAll([])
}

export default { findUserByEmail, createUser, readAll, clearAll }
