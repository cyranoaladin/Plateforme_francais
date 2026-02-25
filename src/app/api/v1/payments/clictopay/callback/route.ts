import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { applyClicToPayStatusToTransaction } from '@/lib/payments/clictopay';
import { logger } from '@/lib/logger';

/**
 * Vérifie la signature ClicToPay si CLICTOPAY_WEBHOOK_SECRET est défini.
 * En production, ce secret DOIT être configuré.
 * Retourne true si la vérification passe (ou si le secret n'est pas configuré en dev).
 */
function verifyClicToPaySignature(params: Record<string, string>): boolean {
  const secret = process.env.CLICTOPAY_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('[ClicToPay] CLICTOPAY_WEBHOOK_SECRET non configuré en production !');
    }
    return true; // fail-open en dev uniquement
  }

  // ClicToPay signe : SHA-256(params triés alphabétiquement + secret)
  const signature = params['checksum'] ?? params['signature'] ?? '';
  if (!signature) return false;

  const sortedParams = Object.entries(params)
    .filter(([key]) => key !== 'checksum' && key !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const expected = createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.alloc(expectedBuf.length);
  Buffer.from(signature).copy(receivedBuf, 0, 0, expectedBuf.length);

  return (
    signature.length === expected.length &&
    timingSafeEqual(expectedBuf, receivedBuf)
  );
}

/**
 * POST /api/v1/payments/clictopay/callback
 * Webhook ClicToPay — pas de CSRF applicatif, mais vérification HMAC.
 */
export async function POST(request: Request) {
  try {
    const text = await request.text();
    const params = Object.fromEntries(new URLSearchParams(text));

    if (!verifyClicToPaySignature(params)) {
      logger.warn({ params }, 'clictopay.callback.invalid_signature');
      return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 });
    }

    const orderRef = params.orderNumber ?? undefined;
    const orderId = params.orderId ?? undefined;

    if (!orderRef && !orderId) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
    }

    const result = await applyClicToPayStatusToTransaction({
      orderRef,
      orderId,
      callbackPayload: params,
    });

    logger.info({ orderRef, orderId, status: result.status }, 'clictopay.callback.received');
    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    logger.error({ error }, 'clictopay.callback.error');
    return NextResponse.json({ error: 'Erreur traitement callback.' }, { status: 500 });
  }
}

/**
 * GET /api/v1/payments/clictopay/callback
 * Certaines intégrations redirigent en GET.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderRef = url.searchParams.get('orderNumber') ?? undefined;
  const orderId = url.searchParams.get('orderId') ?? undefined;

  if (!orderRef && !orderId) {
    return NextResponse.redirect(new URL('/paiement/refus', url.origin));
  }

  try {
    const result = await applyClicToPayStatusToTransaction({ orderRef, orderId });
    const redirectPath = result.status === 'ACCEPTED' ? '/paiement/confirmation' : '/paiement/refus';
    return NextResponse.redirect(
      new URL(`${redirectPath}?ref=${orderRef ?? orderId}`, url.origin),
    );
  } catch {
    return NextResponse.redirect(new URL('/paiement/refus', url.origin));
  }
}
