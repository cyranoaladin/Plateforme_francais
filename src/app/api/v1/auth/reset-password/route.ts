import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { createPasswordCredentials } from '@/lib/auth/session';
import { sendPasswordChangedEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';
import { resetPasswordBodySchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const limit = await checkRateLimit({
    request,
    key: 'auth:reset-password',
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez plus tard.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  const parsed = await parseJsonBody(request, resetPasswordBodySchema);
  if (!parsed.success) return parsed.response;

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetToken) {
    return NextResponse.json({ error: 'Lien de réinitialisation invalide.' }, { status: 400 });
  }
  if (resetToken.usedAt) {
    return NextResponse.json({ error: 'Ce lien a déjà été utilisé.' }, { status: 400 });
  }
  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Ce lien a expiré. Veuillez refaire une demande.' }, { status: 400 });
  }

  const credentials = createPasswordCredentials(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: credentials.passwordHash,
        passwordSalt: credentials.passwordSalt,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  logger.info({ userId: resetToken.userId }, 'auth.reset_password.success');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy';
  const fmt = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const user = await prisma.user.findUnique({
    where: { id: resetToken.userId },
    include: { profile: { select: { displayName: true } } },
  });

  if (user?.email) {
    void sendPasswordChangedEmail({
      firstName: (user.profile?.displayName ?? '').split(/\s+/)[0] ?? '',
      email: user.email,
      changedAt: fmt(new Date()),
      loginUrl: `${appUrl}/login`,
    }).catch((err) => logger.error({ err, userId: resetToken.userId }, 'reset-password.changed_email_failed'));
  }

  return NextResponse.json({ ok: true, message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' });
}
