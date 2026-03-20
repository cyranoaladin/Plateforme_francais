import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { applyClicToPayStatusToTransaction } from '@/lib/payments/clictopay';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { sendSubscriptionConfirmationEmail } from '@/lib/email/service';

/* ─── IP Allowlist ─── */
const CLICTOPAY_IP_ALLOWLIST = (process.env.CLICTOPAY_IP_ALLOWLIST ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isIpAllowed(clientIp: string): boolean {
  if (CLICTOPAY_IP_ALLOWLIST.length === 0) return true; // not configured = allow all
  return CLICTOPAY_IP_ALLOWLIST.some((allowed) => {
    if (allowed.includes('/')) {
      // Simple CIDR match (IPv4 only)
      const [subnet, bits] = allowed.split('/');
      const mask = ~((1 << (32 - Number(bits))) - 1) >>> 0;
      const subnetNum = ipToNum(subnet!);
      const clientNum = ipToNum(clientIp);
      return (subnetNum & mask) === (clientNum & mask);
    }
    return allowed === clientIp;
  });
}

function ipToNum(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0;
}

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
      return false;
    }
    return true;
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
    // 1. IP Allowlist
    const clientIp = (request.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() ?? '';
    if (!isIpAllowed(clientIp)) {
      logger.warn({ clientIp }, 'clictopay.callback.ip_blocked');
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    }

    const text = await request.text();
    const params = Object.fromEntries(new URLSearchParams(text));

    // 2. HMAC signature verification
    if (!verifyClicToPaySignature(params)) {
      logger.warn({ params }, 'clictopay.callback.invalid_signature');
      return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 });
    }

    const orderRef = params.orderNumber ?? undefined;
    const orderId = params.orderId ?? undefined;

    if (!orderRef && !orderId) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
    }

    // 3. Idempotence: if this transaction was already processed, return early
    if (orderRef) {
      try {
        const existing = await prisma.paymentTransaction.findFirst({
          where: { orderRef, status: 'ACCEPTED' },
        });
        if (existing) {
          logger.info({ orderRef }, 'clictopay.callback.idempotent_skip');
          return NextResponse.json({ ok: true, idempotent: true, status: 'ACCEPTED' });
        }
      } catch {
        // Non-blocking: proceed with normal flow if DB check fails
      }
    }

    const result = await applyClicToPayStatusToTransaction({
      orderRef,
      orderId,
      callbackPayload: params,
    });

    logger.info({ orderRef, orderId, status: result.status }, 'clictopay.callback.received');

    // Fire-and-forget: envoyer email de confirmation si paiement accepté
    if (result.status === 'ACCEPTED') {
      try {
        const tx = orderRef
          ? await prisma.paymentTransaction.findUnique({ where: { orderRef }, select: { userId: true } })
          : await prisma.paymentTransaction.findFirst({ where: { providerRef: orderId }, select: { userId: true } });
        if (tx?.userId) {
          const userForEmail = await prisma.user.findUnique({
            where: { id: tx.userId },
            select: { email: true },
          });
          const sub = await prisma.subscription.findUnique({
            where: { userId: tx.userId },
            select: { plan: true },
          });
          if (userForEmail && sub) {
            const firstName = userForEmail.email.split('@')[0] ?? 'là';
            const nextBilling = new Date();
            nextBilling.setDate(nextBilling.getDate() + 30);
            sendSubscriptionConfirmationEmail({
              user: { firstName, email: userForEmail.email },
              plan: sub.plan as 'MONTHLY' | 'LIFETIME' | 'PREMIUM' | 'PRO' | 'MAX',
              transactionId: orderRef ?? orderId ?? 'N/A',
              startDate: new Date(),
              nextBillingDate: nextBilling,
            }).catch((err) => {
              logger.error({ err }, 'Erreur email confirmation souscription');
            });
          }
        }
      } catch {
        // Non-blocking
      }
    }

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
    const redirectUrl = new URL(redirectPath, url.origin);
    if (orderRef) {
      redirectUrl.searchParams.set('orderRef', orderRef);
    }
    if (orderId) {
      redirectUrl.searchParams.set('orderId', orderId);
    }
    return NextResponse.redirect(redirectUrl);
  } catch {
    return NextResponse.redirect(new URL('/paiement/refus', url.origin));
  }
}
