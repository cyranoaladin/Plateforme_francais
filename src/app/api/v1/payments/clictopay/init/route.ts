import { NextResponse } from 'next/server';

/**
 * POST /api/v1/payments/clictopay/init
 * DISABLED — ClicToPay payment is not active at go-live.
 * Returns 503 Service Unavailable with manual payment instructions.
 */
export async function POST(_request: Request) {
  return NextResponse.json(
    {
      error: 'Paiement carte désactivé. Utilisez le virement bancaire ou contactez-nous via WhatsApp.',
      code: 'PAYMENT_METHOD_DISABLED',
      alternative: {
        method: 'bank_transfer',
        whatsapp: '+21699192829',
        instructions: 'Virement bancaire avec votre email en référence, puis activation par code.',
      },
    },
    { status: 503 }
  );
}
