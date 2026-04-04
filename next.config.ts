import { execSync } from 'child_process'
import type { NextConfig } from 'next'

const appRoot = process.cwd()

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

const SECURITY_HEADERS = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // CSP is handled in middleware to support runtime nonce/header logic.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), geolocation=()' },
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
  // The pedagogical library is a durable volume mounted outside the build.
  // It is restored as a symlink after deploy and must not be copied into standalone.
  outputFileTracingExcludes: {
    '*': [
      'ressources',
      'ressources/**/*',
      '/srv/eaf_ressources/**/*',
      'src/lib/ressources/path.ts',
    ],
  },
  outputFileTracingRoot: appRoot,
  reactStrictMode: true,
  // Image optimization: SVG support + modern formats
  // dangerouslyAllowSVG is enabled for internal pedagogical illustrations
  // served only from /public/assets/illustrations/ (trusted sources).
  // No user-uploaded SVGs are served via next/image.
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  // Remove X-Powered-By header (information disclosure)
  poweredByHeader: false,
  // Next.js 16 defaults to Turbopack; empty config silences the
  // "webpack config without turbopack config" build error.
  turbopack: {
    root: appRoot,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias['pdfjs-dist'] = false;
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/landing',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
