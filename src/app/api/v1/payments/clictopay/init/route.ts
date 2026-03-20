import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUserId } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { initiateClicToPayPayment } from '@/lib/payments/clictopay';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';

const ALLOWED_MONTHS = [1, 3, 6, 12] as const;

const initBodySchema = z.object({
  plan: z.enum(['PREMIUM', 'PRO', 'MONTHLY', 'LIFETIME']),
  months: z.number().int().refine((v) => (ALLOWED_MONTHS as readonly number[]).includes(v)).optional().default(1),
});

function toCheckoutPlan(raw: z.infer<typeof initBodySchema>['plan']): 'PREMIUM' | 'PRO' {
  if (raw === 'PRO' || raw === 'LIFETIME') return 'PRO';
  return 'PREMIUM';
}

/**
 * POST /api/v1/payments/clictopay/init
 * DISABLED — ClicToPay payment is not active at go-live.
 * Returns 503 Service Unavailable with manual payment instructions.
 */
export async function POST(request: Request) {
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
