import { NextResponse } from 'next/server';
import {
  clearRoleCookie,
  clearSessionCookie,
  getAuthenticatedUser,
} from '@/lib/auth/session';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { deleteSessionByToken } from '@/lib/db/repositories/sessionRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';

export async function POST(request: Request) {
  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const auth = await getAuthenticatedUser();
  if (auth) {
    await deleteSessionByToken(auth.token);
    await createMemoryEventRecord(
      createMemoryEvent(auth.user.id, {
        type: 'auth',
        feature: 'logout',
      }),
    );
  }

  await clearSessionCookie();
  await clearRoleCookie();
  return NextResponse.json({ ok: true }, { status: 200 });
}
