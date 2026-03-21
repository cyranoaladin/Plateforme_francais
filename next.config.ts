import { execSync } from 'child_process'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

function getGitSha(): string {
  // Prefer BUILD_GIT_SHA env var (injected by deploy.sh on server where .git is absent)
  if (process.env.BUILD_GIT_SHA && process.env.BUILD_GIT_SHA !== 'unknown') {
    return process.env.BUILD_GIT_SHA
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const SECURITY_HEADERS = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // CSP is handled in middleware to support runtime nonce/header logic.
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
  // Inject build-time release metadata into server runtime
  env: {
    BUILD_GIT_SHA: getGitSha(),
    BUILD_TIME: new Date().toISOString(),
  },
  // Skip static generation - use standalone server mode
  output: 'standalone',
  // Disable React strict mode to avoid context issues in error boundaries
  reactStrictMode: false,
  // Allow SVG in next/image with XSS protection
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Remove X-Powered-By header (information disclosure)
  poweredByHeader: false,
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
}

export default nextConfig
