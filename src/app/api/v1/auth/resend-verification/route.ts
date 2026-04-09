import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { prisma } from '@/lib/db/client';
import { sendEmailVerificationEmail } from '@/lib/email/service';
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

  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy';
  const verifyLink = `${appUrl}/api/v1/auth/verify-email?token=${rawToken}`;

  void sendEmailVerificationEmail({
    firstName: '',
    email: user.email,
    verifyUrl: verifyLink,
    expiresAt: emailVerifyExpiry.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }).catch((err) => logger.error({ err, userId: auth.user.id }, 'resend_verification.email_send_failed'));

  logger.info({ userId: auth.user.id }, 'auth.resend_verification.success');

  return NextResponse.json({ ok: true });
}
