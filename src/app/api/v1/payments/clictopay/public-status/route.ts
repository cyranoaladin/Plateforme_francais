import { NextResponse } from 'next/server';
import { resolvePublicPaymentStatus } from '@/lib/payments/clictopay';
import { logger } from '@/lib/logger';

/**
 * GET /api/v1/payments/clictopay/public-status?orderRef=...&orderId=...
 * Public endpoint for checking payment status (used by confirmation page).
 * No auth required — only returns non-sensitive payment status info.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderRef = url.searchParams.get('orderRef') ?? undefined;
    const orderId = url.searchParams.get('orderId') ?? undefined;

    if (!orderRef && !orderId) {
      return NextResponse.json(
        { error: 'Paramètre orderRef ou orderId requis.' },
        { status: 400 },
      );
    }

    const result = await resolvePublicPaymentStatus({ orderRef, orderId });

    if (!result) {
      return NextResponse.json(
        { error: 'Transaction introuvable.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      orderRef: result.orderRef,
      status: result.status,
      plan: result.plan,
      amountMillimes: result.amountMillimes,
      currency: result.currency,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    logger.error({ error }, 'clictopay.public_status.error');
    return NextResponse.json(
      { error: 'Impossible de vérifier le statut du paiement.' },
      { status: 500 },
    );
  }
}
