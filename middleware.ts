import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/bienvenue'];
const PUBLIC_API_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/health',
  '/api/v1/payments/clictopay/callback',
];

/**
 * Security headers per cahier des charges V2 P0-7.
 * HSTS 2 years, X-Frame-Options DENY.
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "media-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  );
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  const isPublicPage = PUBLIC_PATHS.some((item) => pathname === item);
  const isPublicApi = PUBLIC_API_PATHS.some((item) => pathname === item);
  const token = request.cookies.get('eaf_session')?.value;

  if (!token && pathname.startsWith('/api') && !isPublicApi) {
    return applySecurityHeaders(
      NextResponse.json({ error: 'Non authentifié.' }, { status: 401 }),
    );
  }

  if (!token && !pathname.startsWith('/api') && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  if (token && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!.*\\..*).*)'],
};
