import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { sendPasswordResetEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';
import { forgotPasswordBodySchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const limit = await checkRateLimit({
    request,
    key: 'auth:forgot-password',
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez plus tard.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  const parsed = await parseJsonBody(request, forgotPasswordBodySchema);
  if (!parsed.success) return parsed.response;

  const email = parsed.data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: { select: { displayName: true } } },
  });

  if (user) {
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy';
    const resetLink = `${appUrl}/login?mode=reset&token=${rawToken}`;

    const fmt = (d: Date) =>
      d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    void sendPasswordResetEmail({
      firstName: (user.profile?.displayName ?? '').split(/\s+/)[0] ?? '',
      email,
      resetUrl: resetLink,
      expiresAt: fmt(expiresAt),
    }).catch((err) => logger.error({ err, email }, 'forgot-password.email_send_failed'));

    logger.info({ userId: user.id }, 'auth.forgot_password.token_created');
  }

  return NextResponse.json({ ok: true, message: 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.' });
}
