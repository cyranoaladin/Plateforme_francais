import { NextResponse } from 'next/server';

/**
 * POST /api/v1/payments/clictopay/callback
 * DISABLED — ClicToPay payment is not active at go-live.
 * Returns 503 Service Unavailable.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Paiement carte désactivé. Utilisez le virement bancaire ou contactez-nous via WhatsApp.',
      code: 'PAYMENT_METHOD_DISABLED',
    },
    { status: 503 }
  );
}

/**
 * GET /api/v1/payments/clictopay/callback
 * DISABLED — ClicToPay payment is not active at go-live.
 * Redirects to payment refusal page with informational message.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  // Redirect to refusal page with informational message about manual payment
  const redirectUrl = new URL('/paiement/refus', url.origin);
  redirectUrl.searchParams.set('reason', 'Paiement carte désactivé. Utilisez le virement bancaire ou WhatsApp +21699192829');
  return NextResponse.redirect(redirectUrl);
}
