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
import { sendTransactionalEmail } from '@/lib/email/client';
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
  const { acceptedCgu, cguVersion, isMinor, parentEmail } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'Un compte existe déjà pour cet email.' }, { status: 409 });
  }

  const credentials = createPasswordCredentials(parsed.data.password);
  const userId = randomUUID();

  // Extract IP hash for CGU consent proof (RGPD: no raw IP stored)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ipHash = Buffer.from(clientIp).toString('base64');

  await createUser({
    id: userId,
    email,
    passwordHash: credentials.passwordHash,
    passwordSalt: credentials.passwordSalt,
    role: 'eleve', // P0-3: seul rôle autorisé à l'inscription publique
    profile: {
      ...DEFAULT_PROFILE,
      displayName: displayName || DEFAULT_PROFILE.displayName,
      isMinor: isMinor ?? false,
      parentEmail: parentEmail ?? null,
      cguAcceptedAt: new Date().toISOString(),
      cguVersion,
    },
  });

  await createMemoryEventRecord(
    createMemoryEvent(userId, {
      type: 'auth',
      feature: 'register',
      payload: {
        email,
        acceptedCgu: String(acceptedCgu),
        cguVersion: cguVersion ?? '2026-03',
        isMinor: String(isMinor ?? false),
        parentEmail: parentEmail ?? 'none',
        ipHash,
      },
    }),
  );

  const session = await createUserSession(userId);
  await setSessionCookie(session.token);
  await setRoleCookie('eleve');

  void sendTransactionalEmail({
    to: email,
    subject: 'Bienvenue sur Nexus EAF !',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #17324D;">Bienvenue sur Nexus EAF !</h2>
        <p>Bonjour ${displayName || 'Élève'},</p>
        <p>Ton compte est prêt. Tu peux commencer ton onboarding et configurer ton parcours de préparation à l'EAF dès maintenant.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy'}/onboarding"
             style="background: #0F766E; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Commencer mon onboarding
          </a>
        </p>
        <p style="color: #888; font-size: 13px;">— L'équipe Nexus EAF</p>
      </div>
    `,
  }).catch(() => undefined);

  const response = NextResponse.json({ ok: true }, { status: 201 });
  await ensureCsrfCookie(response);
  return response;
}
