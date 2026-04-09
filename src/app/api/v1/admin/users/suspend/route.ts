import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { prisma } from '@/lib/db/client';
import { logAdminAction, getClientIp } from '@/lib/admin/audit';
import { logger } from '@/lib/logger';

export async function PATCH(request: Request) {
  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Revoke active sessions and pause subscription if exists (instead of changing role)
    await prisma.$transaction([
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
      prisma.subscription.updateMany({
        where: { userId },
        data: {
          status: 'PAUSED',
          updatedAt: new Date(),
        },
      }),
    ]);

    logAdminAction({ adminId: auth.user.id, action: 'user.suspend', targetType: 'user', targetId: userId, details: { email: user.email }, ip: getClientIp(request) });

    return NextResponse.json({
      success: true,
      message: 'Utilisateur suspendu avec succès',
    }, { status: 200 });

  } catch (error) {
    logger.error({ error }, 'admin.users.suspend.failed');
    return NextResponse.json(
      { error: 'Erreur lors de la suspension de l\'utilisateur' },
      { status: 500 }
    );
  }
}
