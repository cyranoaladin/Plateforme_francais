import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';
import { z } from 'zod';
import type { PaymentProvider, SubscriptionPlan } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { PLAN_CATALOG, normalizePlanId, formatPlanLabel } from '@/lib/billing/plan-catalog';
import { logger } from '@/lib/logger';

const orderBodySchema = z.object({
  plan: z.enum(['PREMIUM', 'MASTERIUM']),
  method: z.enum(['virement', 'espèces']),
});

function generateOrderRef(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NX-${year}-${random}`;
}

/**
 * POST /api/v1/billing/order
 * Body: { plan: 'PREMIUM' | 'MASTERIUM', method: 'virement' | 'espèces' }
 *
 * Creates a PENDING PaymentTransaction and returns order details with
 * payment instructions.
 */
export async function POST(request: Request) {
  try {
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
      key: `billing:order:${auth.user.id}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessaie plus tard.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    const parsed = await parseJsonBody(request, orderBodySchema);
    if (!parsed.success) return parsed.response;

    const { plan, method } = parsed.data;
    const internalPlan = normalizePlanId(plan);

    if (internalPlan === 'FREE') {
      return NextResponse.json(
        { error: 'Le plan Freemium est gratuit, aucune commande nécessaire.' },
        { status: 400 },
      );
    }

    const planConfig = PLAN_CATALOG[internalPlan];
    const amountMillimes = planConfig.priceTnd * 1000;
    const provider: PaymentProvider = method === 'virement' ? 'VIREMENT' : 'MANUAL';
    const orderRef = generateOrderRef();

    const payment = await prisma.paymentTransaction.create({
      data: {
        userId: auth.user.id,
        provider,
        status: 'PENDING',
        plan: internalPlan as SubscriptionPlan,
        amountMillimes,
        orderRef,
        initiatedAt: new Date(),
      },
    });

    const amountTnd = (amountMillimes / 1000).toFixed(3);
    const planLabel = formatPlanLabel(internalPlan);

    const instructions =
      method === 'virement'
        ? `Effectue un virement de ${amountTnd} TND avec la référence ${orderRef} sur le compte bancaire STE M&M ACADEMY SUARL (RIB: TN5925079000000156908404).`
        : `Règlement en espèces de ${amountTnd} TND avec la référence ${orderRef}. Contacte l'équipe Nexus pour organiser le paiement.`;

    logger.info(
      { userId: auth.user.id, orderId: payment.id, orderRef, plan: internalPlan, method },
      'billing:order_created',
    );

    return NextResponse.json(
      {
        orderId: payment.id,
        reference: orderRef,
        amount: amountTnd,
        currency: 'TND',
        plan: planLabel,
        method,
        instructions,
      },
      { status: 201 },
    );
  } catch (err) {
    logger.error(
      { error: err instanceof Error ? err.message : String(err) },
      'billing:order:unhandled_error',
    );
    return NextResponse.json(
      { error: 'Erreur interne. Réessaie dans quelques instants.' },
      { status: 500 },
    );
  }
}
