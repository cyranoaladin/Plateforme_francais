import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import {
  createPasswordCredentials,
  createUserSession,
  setRoleCookie,
  setSessionCookie,
} from '@/lib/auth/session';
import { type StudentProfile } from '@/lib/auth/types';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { createUser, findUserByEmail } from '@/lib/db/repositories/userRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { ensureCsrfCookie } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';
import { registerBodySchema } from '@/lib/validation/schemas';

const DEFAULT_PROFILE: StudentProfile = {
  displayName: 'Élève',
  classLevel: 'Première générale',
  targetScore: '14/20',
  onboardingCompleted: false,
  selectedOeuvres: [],
  parcoursProgress: [],
  badges: [],
  preferredObjects: [],
  weakSkills: ['Problématisation', 'Grammaire'],
};

export async function POST(request: Request) {
  const limit = await checkRateLimit({
    request,
    key: 'auth:register',
    limit: 3,
    windowMs: 60 * 60 * 1000,
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

  const parsed = await parseJsonBody(request, registerBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const displayName = parsed.data.displayName?.trim() ?? '';

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'Un compte existe déjà pour cet email.' }, { status: 409 });
  }

  const credentials = createPasswordCredentials(parsed.data.password);
  const userId = randomUUID();

  await createUser({
    id: userId,
    email,
    passwordHash: credentials.passwordHash,
    passwordSalt: credentials.passwordSalt,
    role: 'eleve',
    profile: {
      ...DEFAULT_PROFILE,
      displayName: displayName || DEFAULT_PROFILE.displayName,
    },
  });

  await createMemoryEventRecord(
    createMemoryEvent(userId, {
      type: 'auth',
      feature: 'register',
      payload: { email },
    }),
  );

  const session = await createUserSession(userId);
  await setSessionCookie(session.token);
  await setRoleCookie('eleve');

  const response = NextResponse.json({ ok: true }, { status: 201 });
  await ensureCsrfCookie(response);
  return response;
}
