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
  '/paiement/confirmation',
  '/paiement/refus',
  '/mentions-legales',
  '/api',
  '/_next',
  '/images',
  '/favicon.ico',
  '/ressources',
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_PATHS) {
    if (pathname.startsWith(prefix + '/')) return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check session cookie
  const sessionToken = request.cookies.get('eaf_session')?.value;
  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add CSP nonce header
  const nonce = edgeRandomBase64(16);
  const response = NextResponse.next();
  response.headers.set('x-nonce', nonce);

  // Content Security Policy with nonce
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `media-src 'self' blob:`,
    `connect-src 'self' https://ipay.clictopay.com https://rag-api.nexusreussite.academy https://api.mistral.ai https://generativelanguage.googleapis.com https://api.openai.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  // Additional security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
