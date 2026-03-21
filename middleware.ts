import { NextResponse, type NextRequest } from 'next/server';

function edgeRandomBase64(byteCount: number): string {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/bienvenue',
  '/pricing',
  '/contact',
  '/paiement/confirmation',
  '/paiement/refus',
  '/mentions-legales',
  '/cgu',
  '/politique-de-confidentialite',
  '/_next',
  '/images',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/ressources',
]);

/** API routes that genuinely need to be public (no session cookie required). */
const PUBLIC_API_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/health',
  '/api/v1/rag/health',
  '/api/v1/csrf',
  '/api/v1/contact',
  '/api/v1/exam-info',
  '/api/v1/ressources',
  '/api/v1/metrics/vitals',
  '/api/mcp/health',
]);

const CANONICAL_ALIAS_PATHS = new Set(['/bienvenue', '/landing']);

/** French aliases → canonical paths (public redirects, no auth needed). */
const FRENCH_ALIASES: Record<string, string> = {
  '/connexion': '/login',
  '/inscription': '/login?mode=register',
  '/tarifs': '/pricing',
};

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_PATHS) {
    if (pathname.startsWith(prefix + '/')) return true;
  }
  // Check public API routes (explicit allowlist instead of blanket /api)
  if (pathname.startsWith('/api')) {
    if (PUBLIC_API_PATHS.has(pathname)) return true;
    for (const prefix of PUBLIC_API_PATHS) {
      if (pathname.startsWith(prefix + '/')) return true;
    }
    // Cron routes protected by CRON_SECRET bearer token, not session cookie
    if (pathname.startsWith('/api/v1/cron')) return true;
    return false;
  }
  return false;
}

function withSecurityHeaders(request: NextRequest): NextResponse {
  const nonce = edgeRandomBase64(16);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('x-nonce', nonce);

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `media-src 'self' blob:`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');

  return response;
}

/** Paths that must never be served — return 404 immediately. */
const BLOCKED_PATHS = ['.env', '.git', 'prisma/', '.antigravity/', '.windsurfrules'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block access to sensitive dotfiles and config
  const lowerPath = pathname.toLowerCase();
  if (BLOCKED_PATHS.some(p => lowerPath.startsWith('/' + p) || lowerPath === '/' + p)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (pathname.startsWith('/api/v1/')) {
    const method = request.method.toUpperCase();
    const allowedMethodsByPath: Record<string, Set<string>> = {
      '/api/v1/health': new Set(['GET']),
      '/api/v1/auth/login': new Set(['POST']),
      '/api/v1/auth/register': new Set(['POST']),
    };

    const allowed = allowedMethodsByPath[pathname];
    if (allowed && !allowed.has(method)) {
      return new NextResponse('Method Not Allowed', { status: 405 });
    }
  }

  if (CANONICAL_ALIAS_PATHS.has(pathname)) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.pathname = '/';
    return NextResponse.redirect(canonicalUrl);
  }

  // French aliases → redirect to canonical paths (public, no auth needed)
  const alias = FRENCH_ALIASES[pathname];
  if (alias) {
    const aliasUrl = new URL(alias, request.url);
    return NextResponse.redirect(aliasUrl);
  }

  // Public paths: serve with CSP but no auth check
  if (isPublicPath(pathname)) {
    return withSecurityHeaders(request);
  }

  // Check session cookie
  const sessionToken = request.cookies.get('eaf_session')?.value;
  if (!sessionToken) {
    if (pathname.startsWith('/api')) {
      return new NextResponse(JSON.stringify({ error: 'Non authentifié.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return withSecurityHeaders(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
