import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/bienvenue'];
const PUBLIC_API_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/health',
  '/api/v1/payments/clictopay/callback',
  '/api/v1/metrics/vitals',
];

/**
 * Security headers per cahier des charges V2 P0-7.
 * 
 * NOTE: CSP avec 'unsafe-inline' pour scripts est REQUIS pour Next.js
 * Next.js utilise des scripts inline pour:
 * - Hydration
 * - Hot reload (dev)
 * - Webpack runtime
 * - React refresh
 * 
 * En production, on pourrait utiliser des nonces, mais Next.js ne le supporte pas nativement.
 * Alternative: Utiliser CSP avec hash des scripts inline (complexe à maintenir)
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  // Note: process.env.NODE_ENV n'est pas fiable dans middleware Next.js
  // On utilise une approche conservative avec 'unsafe-inline' partout
  // C'est requis pour le fonctionnement de Next.js
  
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  
  // CSP adaptée pour Next.js
  // 'unsafe-inline' requis pour scripts inline de Next.js
  // 'unsafe-eval' requis pour webpack (dev + production avec Next.js)
  // connect-src '*' requis pour appels API externes (LLM providers)
  // media-src 'self' blob: mediastream: requis pour lecture vidéo
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://api.mistral.ai https://generativelanguage.googleapis.com https://api.openai.com",
      "media-src 'self' blob: mediastream:",
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
