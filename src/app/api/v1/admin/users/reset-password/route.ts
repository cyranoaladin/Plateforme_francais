import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { prisma } from '@/lib/db/client';
import { sendPasswordResetEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { parseJsonBody } from '@/lib/validation/request';

const bodySchema = z.object({
  userId: z.string().uuid(),
});

/**
 * POST /api/v1/admin/users/reset-password
 * Admin-triggered password reset: generates a reset token and sends the
 * standard reset email to the user. The admin never sees the password.
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) return errorResponse;

  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  const limit = await checkRateLimit({
    request,
    key: 'admin:reset-password',
    limit: 20,
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

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, email: true, profile: { select: { displayName: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  // Generate reset token (same flow as forgot-password)
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy';
  const resetUrl = `${appUrl}/login?mode=reset&token=${rawToken}`;
  const firstName = user.profile?.displayName?.split(' ')[0] ?? '';

  void sendPasswordResetEmail({
    firstName,
    email: user.email,
    resetUrl,
    expiresAt: expiresAt.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }).catch((err) =>
    logger.error({ err, userId: user.id }, 'admin.reset_password.email_failed'),
  );

  logger.info(
    { adminId: auth.user.id, targetUserId: user.id },
    'admin.reset_password.triggered',
  );

  return NextResponse.json({
    ok: true,
    message: `Email de réinitialisation envoyé à ${user.email}.`,
  });
}
