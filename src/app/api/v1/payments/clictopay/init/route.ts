import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUserId } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { initiateClicToPayPayment } from '@/lib/payments/clictopay';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';

const initBodySchema = z.object({
  plan: z.enum(['PREMIUM', 'PRO', 'MONTHLY', 'LIFETIME']),
});

function toCheckoutPlan(raw: z.infer<typeof initBodySchema>['plan']): 'PREMIUM' | 'PRO' {
  if (raw === 'PRO' || raw === 'LIFETIME') return 'PRO';
  return 'PREMIUM';
}

/**
 * POST /api/v1/payments/clictopay/init
 * Initiates a ClicToPay checkout session for the authenticated user.
 */
export async function POST(request: Request) {
  try {
    const csrfError = await validateCsrf(request);
    if (csrfError) return csrfError;

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const limit = await checkRateLimit({
      request,
      key: `payment:init:${userId}`,
      limit: 5,
      windowMs: 60 * 1000,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    }

    const parsed = await parseJsonBody(request, initBodySchema);
    if (!parsed.success) return parsed.response;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    const result = await initiateClicToPayPayment({
      userId,
      plan: toCheckoutPlan(parsed.data.plan),
      email: user.email,
    });

    return NextResponse.json({
      checkoutUrl: result.redirectUrl,
      orderRef: result.orderRef,
    });
  } catch (error) {
    logger.error({ error }, 'clictopay.init.error');
    return NextResponse.json(
      { error: 'Impossible d\'initier le paiement. Réessayez.' },
      { status: 500 },
    );
  }
}
