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
import { sendWelcomeEmail, sendParentNotificationEmail, sendTeacherNotificationEmail } from '@/lib/email/service';
import { generateConsentToken, sendParentalConsentEmail } from '@/lib/email/parental-consent';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { createMemoryEvent } from '@/lib/memory/store';
import { ensureLinkedRoleAccount } from '@/lib/auth/linked-role-accounts';
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
  const { acceptedCgu, cguVersion, isMinor } = parsed.data;
  const parentEmail = parsed.data.parentEmail?.trim().toLowerCase();
  const teacherEmail = parsed.data.teacherEmail?.trim().toLowerCase();

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
      teacherEmail: teacherEmail ?? null,
      cguAcceptedAt: new Date().toISOString(),
      cguVersion,
      // RGPD: Generate consent token if minor with parent email
      parentConsentToken: (isMinor && parentEmail) ? generateConsentToken() : null,
      parentConsentStatus: (isMinor && parentEmail) ? 'pending' : null,
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

  const firstName = (displayName || '').trim().split(/\s+/)[0]?.trim() || '';
  
  // Send welcome email to student
  sendWelcomeEmail({ firstName, email })
    .then((result) => {
      if (!result.success) {
        logger.warn(
          { userId, error: result.error },
          'Échec envoi email de bienvenue (non bloquant)',
        );
      }
    })
    .catch((err) => {
      logger.error(
        { err, userId },
        'Erreur inattendue envoi email bienvenue',
      );
    });

  // RGPD: Send parental consent email if minor with parent email
  if (isMinor && parentEmail) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { parentConsentToken: true },
    });

    if (profile?.parentConsentToken) {
      sendParentalConsentEmail({
        parentEmail,
        studentEmail: email,
        studentName: displayName || firstName,
        consentToken: profile.parentConsentToken,
      }).then((result) => {
        if (!result.success) {
          logger.warn(
            { userId, parentEmail, error: result.error },
            'Échec envoi email consentement parental (non bloquant)',
          );
        }
      }).catch((err) => {
        logger.error(
          { err, userId, parentEmail },
          'Erreur inattendue envoi email consentement parental',
        );
      });
    }
  }

  // Notification email parent (non bloquant)
  if (parentEmail) {
    const parentAccount = await ensureLinkedRoleAccount({
      email: parentEmail,
      role: 'parent',
      studentDisplayName: displayName || firstName,
    });

    if (parentAccount.status === 'existing') {
      sendParentNotificationEmail({
        parentEmail,
        studentFirstName: firstName,
      }).then((result) => {
        if (result.success) {
          logger.info({ emailId: result.id, to: parentEmail, type: 'parent-notification' }, 'E-mail parent envoyé avec succès');
        } else {
          logger.warn({ to: parentEmail, error: result.error, type: 'parent-notification' }, 'Échec envoi e-mail parent (non bloquant)');
        }
      }).catch((err) => {
        logger.error({ err, to: parentEmail, type: 'parent-notification' }, 'Erreur inattendue envoi e-mail parent');
      });
    }
  }

  // Notification email enseignant (non bloquant)
  if (teacherEmail) {
    const teacherAccount = await ensureLinkedRoleAccount({
      email: teacherEmail,
      role: 'enseignant',
      studentDisplayName: displayName || firstName,
    });

    if (teacherAccount.status === 'existing') {
      sendTeacherNotificationEmail({
        teacherEmail,
        studentFirstName: firstName,
        studentLastName: displayName.split(' ').slice(1).join(' ').trim() || undefined,
      }).then((result) => {
        if (result.success) {
          logger.info({ emailId: result.id, to: teacherEmail, type: 'teacher-notification' }, 'E-mail enseignant envoyé avec succès');
        } else {
          logger.warn({ to: teacherEmail, error: result.error, type: 'teacher-notification' }, 'Échec envoi e-mail enseignant (non bloquant)');
        }
      }).catch((err) => {
        logger.error({ err, to: teacherEmail, type: 'teacher-notification' }, 'Erreur inattendue envoi e-mail enseignant');
      });
    }
  }

  const response = NextResponse.json({ ok: true }, { status: 201 });
  await ensureCsrfCookie(response);
  return response;
}
