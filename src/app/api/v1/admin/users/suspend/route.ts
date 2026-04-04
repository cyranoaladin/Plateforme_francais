import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';

export async function PATCH(request: Request) {
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

    return NextResponse.json({
      success: true,
      message: 'Utilisateur suspendu avec succès',
    }, { status: 200 });

  } catch (error) {
    console.error('Error suspending user:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suspension de l\'utilisateur' },
      { status: 500 }
    );
  }
}
