Secure Vault (MVP)

A minimal password generator and encrypted vault application built with Next.js, TypeScript, and MongoDB, designed to be privacy-first and efficient.

Quick Start
1. Prepare Environment

Copy .env.local.example to .env.local and fill in your values:

MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=long_random_secret
NEXT_PUBLIC_APP_NAME=SecureVault

2. Install Dependencies
npm install

3. Run Locally (Development)
npm run dev

4. Run in Docker (Production Build — clean environment)
# build Docker image
docker build -t secure-vault:prod .

# run container and map port 3000
docker run --rm -p 3000:3000 secure-vault:prod
Crypto Note

This application uses the Web Crypto API to encrypt vault data directly in the browser. A key is derived from the user’s master password, and encryption is performed before sending data to the server. The server only stores encrypted blobs (including IV, salt, and ciphertext) and never receives plaintext data. This approach keeps all user data private and secure.
