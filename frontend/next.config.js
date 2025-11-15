/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_MCP_WS_URL: process.env.NEXT_PUBLIC_MCP_WS_URL || 'ws://localhost:8080',
    NEXT_PUBLIC_ASCIINEMA_URL: process.env.NEXT_PUBLIC_ASCIINEMA_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig

