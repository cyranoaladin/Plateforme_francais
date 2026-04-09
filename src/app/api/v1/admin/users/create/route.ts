import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { createPasswordCredentials } from '@/lib/auth/session';
import { type StudentProfile } from '@/lib/auth/types';
import { createUser, findUserByEmail } from '@/lib/db/repositories/userRepo';
import { getCurrentAnneeScolaire } from '@/lib/date/current-school-year';
import { logAdminAction, getClientIp } from '@/lib/admin/audit';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['eleve', 'enseignant', 'parent', 'admin']).default('eleve'),
  displayName: z.string().optional(),
});

/**
 * POST /api/v1/admin/users/create
 * Admin creates a new user account (no email verification needed).
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rl = await checkRateLimit({
    request,
    key: `admin:create-user:${auth.user.id}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de requetes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const parsed = await parseJsonBody(request, createUserSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { password, role, displayName } = parsed.data;

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe deja.' },
        { status: 409 },
      );
    }

    const { passwordHash, passwordSalt } = createPasswordCredentials(password);
    const userId = randomUUID();

    const profile: StudentProfile = {
      displayName: displayName || email.split('@')[0],
      classLevel: 'Premiere generale',
      targetScore: '14/20',
      onboardingCompleted: false,
      selectedOeuvres: [],
      parcoursProgress: [],
      badges: [],
      preferredObjects: [],
      weakSkills: [],
      anneeScolaire: getCurrentAnneeScolaire(),
    };

    await createUser({
      id: userId,
      email,
      passwordHash,
      passwordSalt,
      profile,
      role: role as 'eleve' | 'enseignant' | 'parent' | 'admin',
    });

    logger.info({ userId, email, role, createdBy: auth.user.id }, 'admin.user.created');
    logAdminAction({ adminId: auth.user.id, action: 'user.create', targetType: 'user', targetId: userId, details: { email, role }, ip: getClientIp(request) });

    return NextResponse.json(
      {
        success: true,
        user: { id: userId, email, role },
        message: `Utilisateur ${email} cree avec succes.`,
      },
      { status: 201 },
    );
  } catch (err) {
    logger.error({ err, email }, 'admin.user.create.failed');
    return NextResponse.json(
      { error: 'Erreur lors de la creation du compte.' },
      { status: 500 },
    );
  }
}
