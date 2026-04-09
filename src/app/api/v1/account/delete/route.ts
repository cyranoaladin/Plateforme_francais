import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';
import { z } from 'zod';

const deleteAccountBodySchema = z.object({
  confirmEmail: z.string().email(),
});

/**
 * POST /api/v1/account/delete
 * RGPD Article 17 — Right to erasure.
 * User must confirm with their email. Cascade delete removes all data.
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rl = await checkRateLimit({
    request,
    key: `account:delete:${auth.user.id}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessaie plus tard.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const parsed = await parseJsonBody(request, deleteAccountBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  if (parsed.data.confirmEmail.toLowerCase() !== auth.user.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'L\u2019email de confirmation ne correspond pas à ton compte.' },
      { status: 400 },
    );
  }

  // Admin accounts cannot self-delete for safety
  if (auth.user.role === 'admin') {
    return NextResponse.json(
      { error: 'Les comptes administrateurs ne peuvent pas être supprimés via cette interface.' },
      { status: 403 },
    );
  }

  try {
    // Prisma cascade handles all related data
    await prisma.user.delete({
      where: { id: auth.user.id },
    });

    logger.info({ userId: auth.user.id, email: auth.user.email }, 'account.deleted.rgpd');

    return NextResponse.json({
      ok: true,
      message: 'Ton compte et toutes tes données ont été supprimés conformément au RGPD.',
    });
  } catch (err) {
    logger.error({ err, userId: auth.user.id }, 'account.delete.failed');
    return NextResponse.json(
      { error: 'Erreur lors de la suppression. Contacte le DPO : dpo@nexusreussite.academy' },
      { status: 500 },
    );
  }
}
