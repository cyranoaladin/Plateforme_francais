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
  '/cgv',
  '/politique-de-confidentialite',
  '/admin/login',
  '/_next',
  '/manifest.json',
  '/images',
  '/favicon.ico',
  '/favicon.svg',
  '/assets',
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
  '/api/v1/auth/verify-email',
  '/api/v1/health',
  '/api/v1/live',
  '/api/v1/rag/health',
  '/api/v1/csrf',
  '/api/v1/contact',
  '/api/v1/exam-info',
  '/api/v1/ressources',
  '/api/v1/metrics/vitals',
  '/api/mcp/health',
  // Cron routes — protected by CRON_SECRET header, not session cookie
  '/api/v1/cron/session-cleanup',
  '/api/v1/cron/revision-reminders',
  '/api/v1/cron/weekly-reports',
  '/api/v1/cron/subscription-expiry',
]);

const CANONICAL_ALIAS_PATHS = new Set(['/bienvenue', '/landing']);

/** French aliases → canonical paths (public redirects, no auth needed). */
const FRENCH_ALIASES: Record<string, string> = {
  '/connexion': '/login',
  '/inscription': '/login?mode=register',
  '/tarifs': '/pricing',
};

const ALLOWED_METHODS_BY_PATH: Readonly<Record<string, ReadonlySet<string>>> = {
  '/api/v1/health': new Set(['GET', 'HEAD']),
  '/api/v1/live': new Set(['GET', 'HEAD']),
  '/api/v1/auth/login': new Set(['POST']),
  '/api/v1/auth/register': new Set(['POST']),
  '/api/v1/auth/logout': new Set(['POST']),
  '/api/v1/auth/forgot-password': new Set(['POST']),
  '/api/v1/auth/reset-password': new Set(['POST']),
  '/api/v1/auth/resend-verification': new Set(['POST']),
  '/api/v1/auth/verify-email': new Set(['GET']),
  '/api/v1/csrf': new Set(['GET']),
  '/api/v1/contact': new Set(['POST']),
  '/api/v1/billing/order': new Set(['POST']),
  '/api/v1/billing/redeem-code': new Set(['POST']),
  '/api/v1/billing/status': new Set(['GET']),
  '/api/v1/oral/capabilities': new Set(['GET']),
  '/api/v1/oral/jury-respond': new Set(['POST']),
  '/api/v1/oral/session/start': new Set(['POST']),
  '/api/v1/oral/sessions': new Set(['GET']),
  '/api/v1/oral/voice-submit': new Set(['POST']),
  '/api/v1/student/profile': new Set(['GET', 'PUT']),
  '/api/v1/student/descriptif': new Set(['GET', 'POST']),
  '/api/v1/student/oeuvre-choisie': new Set(['PUT']),
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
    return false;
  }
  return false;
}

function withSecurityHeaders(request: NextRequest): NextResponse {
  const nonce = edgeRandomBase64(16);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-csp-nonce', nonce);
  requestHeaders.set('x-next-pathname', request.nextUrl.pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('x-nonce', nonce);
  response.headers.set('x-csp-nonce', nonce);

  const pathname = request.nextUrl.pathname;
  const extraConnectSrc = process.env.NEXT_PUBLIC_CSP_CONNECT_EXTRA?.trim();
  // TODO: Landing page inline styles cleanup required for strict CSP
  // Current state: 289+ inline style={{...}} occurrences across landing components
  // (Hero.tsx, StatsSection.tsx, FAQSection.tsx, FooterCTA.tsx, etc.)
  // Strategy B applied: relaxed CSP until all inline styles are migrated to Tailwind/classes
  // See: src/components/landing/* for migration targets
  const enforceStrictStyleCsp = false; // Temporarily disabled until landing inline styles removed
  const connectSrc = [
    "'self'",
    ...(extraConnectSrc ? extraConnectSrc.split(/\s+/).filter(Boolean) : []),
  ].join(' ');
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'sha256-fs97/YpqsP1FB/sVC7EonuE57ak0m3evRa7LF0W9cdM=' https://cdnjs.cloudflare.com https://connect.facebook.net`,
    enforceStrictStyleCsp ? `style-src 'self'` : `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://*.facebook.com https://*.fbcdn.net https://*.fbsbx.com`,
    `media-src 'self' blob:`,
    `connect-src ${connectSrc} https://*.facebook.com https://*.fbcdn.net`,
    `frame-src https://*.facebook.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://*.facebook.com`,
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  const microphonePolicy = pathname.startsWith('/atelier-oral') ? 'microphone=(self)' : 'microphone=()';
  response.headers.set('Permissions-Policy', `camera=(), ${microphonePolicy}, geolocation=()`);

  return response;
}

/** Paths that must never be served — return 404 immediately. */
const BLOCKED_PATHS = ['.env', '.git', 'prisma', '.antigravity', '.windsurfrules', 'ecosystem.config', 'package.json', 'package-lock.json', 'tsconfig', 'next.config', 'readme', 'runbook', 'docs', '.ds_store', '.htaccess', 'wp-admin', 'wp-login', 'phpmyadmin', 'adminer', 'server-status', 'actuator', 'docker-compose', '.venv', 'ui_ux', '.windsurf', '.claude', '.vscode', 'forensics', 'stryker', 'proxy.ts', 'dockerfile', 'cahier_charges', 'audit_', 'addendum_', 'prompt_claude', 'scripts', 'coverage', 'test-results', '.vitest', '.release.env', '.build_time', '.git_sha', '.superpowers', 'packages'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block access to sensitive dotfiles, config, and dangerous extensions
  const lowerPath = pathname.toLowerCase();
  if (BLOCKED_PATHS.some(p => lowerPath.startsWith('/' + p) || lowerPath === '/' + p)) {
    return new NextResponse('Not Found', { status: 404 });
  }
  // Block dangerous file extensions
  if (/\.(log|sh|py|sql|dump|bak|backup|old|orig|swp|env)$/i.test(pathname)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (pathname.startsWith('/api/v1/')) {
    const method = request.method.toUpperCase();
    const allowed = ALLOWED_METHODS_BY_PATH[pathname];
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
