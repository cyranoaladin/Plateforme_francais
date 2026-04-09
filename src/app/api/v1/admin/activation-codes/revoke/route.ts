import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { logAdminAction, getClientIp } from '@/lib/admin/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const revokeSchema = z.object({
  codeId: z.string(),
});

/**
 * POST /api/v1/admin/activation-codes/revoke
 * Revoke an activation code (only if not yet redeemed).
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

  const parsed = await parseJsonBody(request, revokeSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const code = await prisma.activationCode.findUnique({
      where: { id: parsed.data.codeId },
    });

    if (!code) {
      return NextResponse.json({ error: 'Code introuvable.' }, { status: 404 });
    }

    if (code.status === 'REDEEMED') {
      return NextResponse.json(
        { error: 'Impossible de revoquer un code deja utilise.' },
        { status: 400 },
      );
    }

    await prisma.activationCode.update({
      where: { id: code.id },
      data: { status: 'REVOKED' },
    });

    logger.info({ codeId: code.id, revokedBy: auth.user.id }, 'admin.code.revoked');
    logAdminAction({ adminId: auth.user.id, action: 'code.revoke', targetType: 'code', targetId: code.id, ip: getClientIp(request) });

    return NextResponse.json({
      success: true,
      message: 'Code revoque avec succes.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la revocation du code.' },
      { status: 500 },
    );
  }
}
