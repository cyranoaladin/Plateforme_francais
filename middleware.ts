import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/bienvenue'];
const PUBLIC_API_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/health',
  '/api/v1/payments/clictopay/callback',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  const isPublicPage = PUBLIC_PATHS.some((item) => pathname === item);
  const isPublicApi = PUBLIC_API_PATHS.some((item) => pathname === item);
  const token = request.cookies.get('eaf_session')?.value;

  if (!token && pathname.startsWith('/api') && !isPublicApi) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  if (!token && !pathname.startsWith('/api') && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (token && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // L'autorisation stricte par rôle est vérifiée côté serveur via requireUserRole().
  // Ici, on garde uniquement un hint UX pour les routes UI.
  const isTeacherUiRoute = pathname.startsWith('/enseignant');
  const isParentUiRoute = pathname.startsWith('/parent');

  if (token && isTeacherUiRoute) {
    const role = request.cookies.get('eaf_role')?.value;
    if (role && role !== 'enseignant' && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  if (token && isParentUiRoute) {
    const role = request.cookies.get('eaf_role')?.value;
    if (role && role !== 'parent' && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*).*)'],
};
