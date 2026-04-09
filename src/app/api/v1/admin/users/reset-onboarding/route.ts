import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { prisma } from '@/lib/db/client';
import { logAdminAction, getClientIp } from '@/lib/admin/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { parseJsonBody } from '@/lib/validation/request';

const bodySchema = z.object({
  userId: z.string().uuid(),
});

/**
 * POST /api/v1/admin/users/reset-onboarding
 * Resets onboardingCompleted to false so the student re-enters the
 * onboarding wizard on next login/navigation.
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) return errorResponse;

  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  const limit = await checkRateLimit({
    request,
    key: 'admin:reset-onboarding',
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.success) return parsed.response;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: parsed.data.userId },
    select: { userId: true, onboardingCompleted: true },
  });

  if (!profile) {
    return NextResponse.json({ error: 'Profil élève introuvable.' }, { status: 404 });
  }

  await prisma.studentProfile.update({
    where: { userId: parsed.data.userId },
    data: { onboardingCompleted: false },
  });

  logger.info(
    { adminId: auth.user.id, targetUserId: parsed.data.userId },
    'admin.reset_onboarding.success',
  );
  logAdminAction({ adminId: auth.user.id, action: 'user.reset-onboarding', targetType: 'user', targetId: parsed.data.userId, ip: getClientIp(request) });

  return NextResponse.json({
    ok: true,
    message: 'Onboarding réinitialisé. L\'élève repassera par la configuration au prochain accès.',
  });
}
