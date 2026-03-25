import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { prisma } from '@/lib/db/client';
import { sendTransactionalEmail } from '@/lib/email/client';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  // ── CSRF ─────────────────────────────────────────────
  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  // ── Rate limit ───────────────────────────────────────
  const limit = await checkRateLimit({
    request,
    key: `auth:resend-verification:${auth.user.id}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez plus tard.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  // ── Already verified? ────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { emailVerified: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: 'Email déjà vérifié.' }, { status: 400 });
  }

  // ── Generate new token ───────────────────────────────
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { emailVerifyToken: tokenHash, emailVerifyExpiry },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy';
  const verifyLink = `${appUrl}/api/v1/auth/verify-email?token=${rawToken}`;

  void sendTransactionalEmail({
    to: user.email,
    subject: 'Confirme ton adresse email — Nexus EAF',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #17324D;">Nexus EAF — Vérification</h2>
        <p>Bonjour,</p>
        <p>Confirme ton adresse email en cliquant sur le bouton ci-dessous :</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${verifyLink}" style="background: #0F766E; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Confirmer mon email
          </a>
        </p>
        <p style="color: #888; font-size: 13px;">Ce lien expire dans 24 heures. Si tu n'as pas créé de compte, ignore cet email.</p>
      </div>
    `,
  }).catch((err) => logger.error({ err, userId: auth.user.id }, 'resend_verification.email_send_failed'));

  logger.info({ userId: auth.user.id }, 'auth.resend_verification.success');

  return NextResponse.json({ ok: true });
}
