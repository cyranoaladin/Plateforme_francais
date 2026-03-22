import { NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth/session';
import { getBillingContext } from '@/lib/billing/context';
import { formatPlanLabel } from '@/lib/billing/plan-catalog';
import { prisma } from '@/lib/db/client';

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const billing = await getBillingContext(userId);

  let lastPayment = null;
  try {
    lastPayment = await prisma.paymentTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        orderRef: true,
        plan: true,
        status: true,
        amountMillimes: true,
        currency: true,
        createdAt: true,
      },
    });
  } catch {
    // PaymentTransaction table may not exist yet — gracefully skip
  }

  return NextResponse.json({
    subscription: {
      plan: billing.config.label,
      label: billing.config.label,
      priceTnd: billing.config.priceTnd,
      isActive: billing.isActive,
      endsAt: billing.endsAt?.toISOString() ?? null,
    },
    lastPayment: lastPayment
      ? {
          orderRef: lastPayment.orderRef,
          plan: formatPlanLabel(lastPayment.plan),
          status: lastPayment.status,
          amountMillimes: lastPayment.amountMillimes,
          currency: lastPayment.currency,
          createdAt: lastPayment.createdAt.toISOString(),
        }
      : null,
  });
}
