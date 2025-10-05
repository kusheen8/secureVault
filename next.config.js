/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // write build output to a different folder to avoid stale/locked `.next` artifacts
  distDir: '.next-build',
}

module.exports = nextConfig
