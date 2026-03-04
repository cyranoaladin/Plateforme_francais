import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import {
  createMemoryEventRecord,
} from '@/lib/db/repositories/memoryRepo';
import {
  createSessionRecord,
  findSessionByToken,
  touchSession,
} from '@/lib/db/repositories/sessionRepo';
import { findUserById } from '@/lib/db/repositories/userRepo';
import { createMemoryEvent, createSession, isSessionExpired } from '@/lib/memory/store';
import { type UserRecord } from '@/lib/auth/types';

export const SESSION_COOKIE = 'eaf_session';
export const ROLE_COOKIE = 'eaf_role';

function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 120000, 48, 'sha512').toString('hex');
}

function secureEquals(a: string, b: string): boolean {
  const left = Buffer.from(createHash('sha256').update(a).digest('hex'));
  const right = Buffer.from(createHash('sha256').update(b).digest('hex'));
  return left.length === right.length && timingSafeEqual(left, right);
}

function shouldUseSecureCookie(): boolean {
  if (process.env.COOKIE_SECURE !== undefined) {
    return process.env.COOKIE_SECURE === 'true';
  }
  return process.env.NODE_ENV === 'production';
}

export function createPasswordCredentials(password: string) {
  const passwordSalt = randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, passwordSalt);
  return { passwordHash, passwordSalt };
}

export function verifyPassword(password: string, user: UserRecord): boolean {
  const computed = hashPassword(password, user.passwordSalt);
  return secureEquals(computed, user.passwordHash);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(),
    path: '/',
    maxAge: 14 * 24 * 60 * 60,
  });
}

export async function setRoleCookie(role: 'eleve' | 'enseignant' | 'parent' | 'admin') {
  const cookieStore = await cookies();
  cookieStore.set(ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(),
    path: '/',
    maxAge: 14 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function clearRoleCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ROLE_COOKIE);
}

export async function getSessionTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ?? null;
}

export async function getAuthenticatedUser() {
  const token = await getSessionTokenFromCookies();
  if (!token) {
    return null;
  }

  const session = await findSessionByToken(token);
  if (!session || isSessionExpired(session)) {
    return null;
  }

  const user = await findUserById(session.userId);
  if (!user) {
    return null;
  }

  await touchSession(token);
  return { user, token };
}

/**
 * IDOR-safe: resolve userId from session cookie only.
 * All API routes MUST use this instead of trusting request headers.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const result = await getAuthenticatedUser();
  return result?.user?.id ?? null;
}

export async function createUserSession(userId: string) {
  const session = createSession(userId);
  await createSessionRecord(session);
  await createMemoryEventRecord(
    createMemoryEvent(userId, {
      type: 'auth',
      feature: 'login',
      payload: { method: 'password' },
    }),
  );
  return session;
}
