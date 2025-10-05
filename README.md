Secure Vault
===============

Build in Docker (clean environment, avoids Windows file-lock issues):

```bash
# build image
docker build -t secure-vault:prod .

# run container (map port 3000)
docker run --rm -p 3000:3000 secure-vault:prod
```

You can also run locally with `npm run dev` for development.
# Secure Vault (MVP)

Minimal password generator + encrypted vault built with Next.js + TypeScript and MongoDB.

Quick start

1. copy `.env.local.example` to `.env.local` and fill values:

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=long_random_secret
NEXT_PUBLIC_APP_NAME=SecureVault
```

2. npm install
3. npm run dev

Deploy (Vercel + Mongo Atlas)

- Create a free MongoDB Atlas cluster, add a database user, and copy the connection string.
- Create a new project on Vercel, set environment variables (`MONGODB_URI`, `JWT_SECRET`) in the Vercel dashboard, and link the repo.
- Deploy — the Next API routes will run on Vercel serverless functions.

Crypto note (short)

This app uses the browser Web Crypto API: PBKDF2 for key derivation (from your master password) and AES-GCM for encryption. Keys are derived and used only on the client; the server stores only encrypted blobs (iv, salt, ciphertext) and never sees plaintext.
