import { NextResponse } from 'next/server';
import {
  createUserSession,
  setRoleCookie,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth/session';
import { findUserByEmail } from '@/lib/db/repositories/userRepo';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { ensureCsrfCookie } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { loginBodySchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const limit = await checkRateLimit({
    request,
    key: 'auth:login',
    limit: 10,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez plus tard.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfter) },
      },
    );
  }

  const parsed = await parseJsonBody(request, loginBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await findUserByEmail(email);

  if (!user || !verifyPassword(parsed.data.password, user)) {
    return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
  }

  const session = await createUserSession(user.id);
  await setSessionCookie(session.token);
  await setRoleCookie(user.role);

  const response = NextResponse.json({ ok: true }, { status: 200 });
  await ensureCsrfCookie(response);
  return response;
}
