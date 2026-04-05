import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { toAdminVisibleSubscription } from '@/lib/admin/plan-visibility';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export async function GET(request: Request) {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE))));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        subscription: toAdminVisibleSubscription(user.subscription),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs.' },
      { status: 500 }
    );
  }
}
