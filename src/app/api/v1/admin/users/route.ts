import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { toAdminVisibleSubscription } from '@/lib/admin/plan-visibility';

export async function GET() {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
          },
        },
        profile: {
          select: {
            globalLevel: true,
            classLevel: true,
            voie: true,
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            plan: true,
            amountMillimes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        subscription: toAdminVisibleSubscription(user.subscription),
      })),
    }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs.' },
      { status: 500 }
    );
  }
}
