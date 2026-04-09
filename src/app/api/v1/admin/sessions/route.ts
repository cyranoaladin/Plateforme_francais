import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { logAdminAction, getClientIp } from '@/lib/admin/audit';
import { z } from 'zod';

/**
 * GET /api/v1/admin/sessions
 * Lists active sessions with user info.
 */
export async function GET() {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const now = new Date();

    const sessions = await prisma.session.findMany({
      where: { expiresAt: { gt: now } },
      select: {
        token: false,
        userId: true,
        createdAt: true,
        expiresAt: true,
        lastSeenAt: true,
        user: {
          select: {
            email: true,
            role: true,
            profile: { select: { displayName: true } },
          },
        },
      },
      orderBy: { lastSeenAt: 'desc' },
      take: 200,
    });

    // Session token is the PK — we expose a hash prefix for identification only
    const safeSessions = sessions.map((s) => ({
      userId: s.userId,
      email: s.user.email,
      role: s.user.role,
      displayName: s.user.profile?.displayName ?? null,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      lastSeenAt: s.lastSeenAt,
    }));

    const totalActive = await prisma.session.count({
      where: { expiresAt: { gt: now } },
    });

    return NextResponse.json({ sessions: safeSessions, totalActive }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des sessions.' },
      { status: 500 },
    );
  }
}

const revokeSchema = z.object({
  userId: z.string().uuid(),
});

/**
 * DELETE /api/v1/admin/sessions
 * Revoke all sessions for a given user.
 */
export async function DELETE(request: Request) {
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
    const result = await prisma.session.deleteMany({
      where: { userId: parsed.data.userId },
    });

    logAdminAction({ adminId: auth.user.id, action: 'session.revoke', targetType: 'user', targetId: parsed.data.userId, details: { revoked: result.count }, ip: getClientIp(request) });

    return NextResponse.json({
      success: true,
      revoked: result.count,
      message: `${result.count} session(s) revoquee(s).`,
    });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la revocation des sessions.' },
      { status: 500 },
    );
  }
}
