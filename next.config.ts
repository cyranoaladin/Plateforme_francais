import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const SECURITY_HEADERS = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    // Baseline CSP; middleware injects runtime nonce for scripts.
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://api.mistral.ai https://generativelanguage.googleapis.com https://api.openai.com",
      "media-src 'self' blob: mediastream:",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
      // Headers pour la lecture vidéo
      {
        source: '/ressources/:path*',
        headers: [
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'video/webm,video/x-matroska,video/mp4,application/pdf',
          },
        ],
      },
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  // S'assurer que le dossier ressources est surveillé
  experimental: {
    // Optimisation pour les gros fichiers
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
}

export default nextConfig
