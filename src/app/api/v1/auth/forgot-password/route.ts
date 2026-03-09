import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { sendTransactionalEmail } from '@/lib/email/client';
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

  const user = await prisma.user.findUnique({ where: { email } });

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

    void sendTransactionalEmail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe Nexus EAF',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #17324D;">Nexus EAF — Réinitialisation</h2>
          <p>Bonjour,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="background: #0F766E; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p style="color: #888; font-size: 13px;">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    }).catch((err) => logger.error({ err, email }, 'forgot-password.email_send_failed'));

    logger.info({ userId: user.id }, 'auth.forgot_password.token_created');
  }

  return NextResponse.json({ ok: true, message: 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.' });
}
