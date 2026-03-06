import { NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

/**
 * GET /api/v1/payments/clictopay/status
 * Returns the authenticated user's current subscription and billing status.
 */
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    const lastTransaction = await prisma.paymentTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      subscription: {
        plan: subscription?.plan ?? 'FREE',
        status: subscription?.status ?? 'INACTIVE',
        currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      },
      lastTransaction: lastTransaction
        ? {
            orderRef: lastTransaction.orderRef,
            plan: lastTransaction.plan,
            status: lastTransaction.status,
            amountMillimes: lastTransaction.amountMillimes,
            currency: lastTransaction.currency,
            createdAt: lastTransaction.createdAt,
          }
        : null,
    });
  } catch (error) {
    logger.error({ error }, 'clictopay.status.error');
    return NextResponse.json(
      { error: 'Impossible de charger le statut de facturation.' },
      { status: 500 },
    );
  }
}
