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

    // Update user role to suspended
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'suspended',
        updatedAt: new Date(),
      },
    });

    // Pause subscription if exists
    if (user.id) {
      await prisma.subscription.updateMany({
        where: { userId: user.id },
        data: {
          status: 'PAUSED',
          updatedAt: new Date(),
        },
      });
    }

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
