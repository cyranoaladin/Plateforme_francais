import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/bienvenue', '/pricing', '/paiement/confirmation', '/paiement/refus'];
const PUBLIC_API_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/health',
  '/api/v1/payments/clictopay/callback',
  '/api/v1/payments/clictopay/public-status',
  '/api/v1/metrics/vitals',
];

function applySecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  response.headers.set('x-nonce', nonce);

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
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
  );
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const withHeaders = (response: NextResponse): NextResponse => applySecurityHeaders(response, nonce);

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  const isPublicPage = PUBLIC_PATHS.some((item) => pathname === item);
  const isPublicApi = PUBLIC_API_PATHS.some((item) => pathname === item);
  const token = request.cookies.get('eaf_session')?.value;

  if (!token && pathname.startsWith('/api') && !isPublicApi) {
    return withHeaders(
      NextResponse.json({ error: 'Non authentifié.' }, { status: 401 }),
    );
  }

  if (!token && !pathname.startsWith('/api') && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return withHeaders(NextResponse.redirect(url));
  }

  if (token && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return withHeaders(NextResponse.redirect(url));
  }

  return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ['/((?!.*\\..*).*)'],
};
