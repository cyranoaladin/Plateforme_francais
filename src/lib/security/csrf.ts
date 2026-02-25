import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const CSRF_COOKIE = 'eaf_csrf';
const CSRF_HEADER = 'x-csrf-token';

function createCsrfToken() {
  return randomBytes(24).toString('hex');
}

function shouldUseSecureCookie(): boolean {
  if (process.env.COOKIE_SECURE !== undefined) {
    return process.env.COOKIE_SECURE === 'true';
  }
  return process.env.NODE_ENV === 'production';
}

export async function ensureCsrfCookie(response: NextResponse) {
  const cookieStore = await cookies();
  const current = cookieStore.get(CSRF_COOKIE)?.value;
  const token = current ?? createCsrfToken();

  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(),
    path: '/',
    maxAge: 14 * 24 * 60 * 60,
  });
}

export async function validateCsrf(request: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    return NextResponse.json({ error: 'Jeton CSRF manquant.' }, { status: 403 });
  }

  const left = Buffer.from(createHash('sha256').update(cookieToken).digest('hex'));
  const right = Buffer.from(createHash('sha256').update(headerToken).digest('hex'));
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return NextResponse.json({ error: 'Jeton CSRF invalide.' }, { status: 403 });
  }

  return null;
}
