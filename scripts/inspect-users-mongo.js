const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    const m = line.match(/^(\w+)=(.*)$/);
    if (m) {
      const k = m[1];
      let v = m[2];
      // strip surrounding quotes
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[k] = v;
    }
  })
}

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env.local; app may be using dev store')
    process.exit(1)
  }
  try {
    await mongoose.connect(uri, { dbName: undefined });
    const db = mongoose.connection.db;
    const users = await db.collection('users').find().limit(20).toArray();
    console.log('found', users.length, 'users');
    console.dir(users, { depth: null });
    await mongoose.disconnect();
  } catch (e) {
    console.error('error connecting or querying:', e.message);
    process.exit(1);
  }
}

main();
