import { randomUUID } from 'crypto';
import { type SubscriptionPlan } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { comparePlans, normalizePlanId, type PlanId } from '@/lib/billing/plan-catalog';
import { sendTransactionalEmail } from '@/lib/email/client';
import { logger } from '@/lib/logger';

export type ClicToPayPlan = 'PREMIUM' | 'PRO';

export type ClicToPayInitInput = {
  userId: string;
  plan: ClicToPayPlan;
  email: string;
  months?: number; // 1 (default), 3, 6, 12
};

export type ClicToPayInitResult = {
  redirectUrl: string;
  orderRef: string;
  providerOrderId: string;
};

export type PublicPaymentStatusResult = {
  orderRef: string;
  status: 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'ERROR';
  plan: PlanId;
  amountMillimes: number;
  currency: string;
  updatedAt: Date;
};

type RegisterResponse = {
  errorCode?: string;
  errorMessage?: string;
  formUrl?: string;
  orderId?: string;
};

type OrderStatusResponse = {
  errorCode?: string;
  errorMessage?: string;
  orderNumber?: string;
  orderStatus?: number;
  amount?: number;
  currency?: string;
  actionCode?: number;
  actionCodeDescription?: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} manquante.`);
  }
  return value;
}

function apiBaseUrl(): string {
  const raw = process.env.CLICTOPAY_API_BASE_URL ?? 'https://ipay.clictopay.com';
  return raw.replace(/\/$/, '');
}

function appBaseUrl(): string {
  const raw = process.env.CLICTOPAY_PUBLIC_BASE_URL
    ?? process.env.NEXT_PUBLIC_APP_URL
    ?? 'https://eaf.nexusreussite.academy';
  return raw.replace(/\/$/, '');
}

function callbackUrl(): string {
  return process.env.CLICTOPAY_CALLBACK_URL ?? `${appBaseUrl()}/api/v1/payments/clictopay/callback`;
}

function successUrl(): string {
  return process.env.CLICTOPAY_SUCCESS_URL ?? `${appBaseUrl()}/paiement/confirmation`;
}

function failureUrl(): string {
  return process.env.CLICTOPAY_FAILURE_URL ?? `${appBaseUrl()}/paiement/refus`;
}

const PLAN_PRICE_MILLIMES: Record<ClicToPayPlan, number> = {
  PREMIUM: 99_000,
  PRO: 129_000,
};

function amountForPlanMillimes(plan: ClicToPayPlan, months = 1): number {
  return PLAN_PRICE_MILLIMES[plan] * months;
}

/**
 * Calcul du montant pour un upgrade Premium → Masterium.
 * Règle simple et honnête : on facture la différence de prix × nombre de mois.
 * Pas de prorata au jour près — le plan est immédiatement basculé.
 */
export function amountForUpgradeMillimes(
  fromPlan: ClicToPayPlan,
  toPlan: ClicToPayPlan,
  months = 1,
): number {
  const diff = PLAN_PRICE_MILLIMES[toPlan] - PLAN_PRICE_MILLIMES[fromPlan];
  return Math.max(0, diff) * months;
}

function computePeriodEndForPlan(_plan: PlanId, base: Date, months = 1): Date {
  const periodEnd = new Date(base);
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + months);
  return periodEnd;
}

function isAcceptedStatus(payload: OrderStatusResponse): boolean {
  const status = payload.orderStatus ?? -1;
  // Sberbank-style statuses used by ClicToPay integrations:
  // 2=authorized, 3=deposited. actionCode 0 means success.
  if ((status === 2 || status === 3) && (payload.actionCode ?? 0) === 0) {
    return true;
  }
  return false;
}

function mapPaymentStatus(payload: OrderStatusResponse): 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'ERROR' {
  if (payload.errorCode && payload.errorCode !== '0') {
    return 'ERROR';
  }

  if (isAcceptedStatus(payload)) {
    return 'ACCEPTED';
  }

  const status = payload.orderStatus ?? -1;
  if (status === 0 || status === 1) {
    return 'PENDING';
  }

  return 'REFUSED';
}

async function registerOrder(params: {
  orderRef: string;
  amountMillimes: number;
  customerEmail: string;
}): Promise<RegisterResponse> {
  const userName = requiredEnv('CLICTOPAY_USERNAME');
  const password = requiredEnv('CLICTOPAY_PASSWORD');

  const url = new URL('/payment/rest/register.do', apiBaseUrl());
  url.searchParams.set('userName', userName);
  url.searchParams.set('password', password);
  url.searchParams.set('orderNumber', params.orderRef);
  url.searchParams.set('amount', String(params.amountMillimes));
  url.searchParams.set('currency', '788');
  url.searchParams.set('returnUrl', successUrl());
  url.searchParams.set('failUrl', failureUrl());
  url.searchParams.set('dynamicCallbackUrl', callbackUrl());
  url.searchParams.set('language', 'fr');
  url.searchParams.set('email', params.customerEmail);

  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`register.do HTTP ${response.status}`);
  }

  return (await response.json()) as RegisterResponse;
}

export async function getOrderStatusByOrderId(orderId: string): Promise<OrderStatusResponse> {
  const userName = requiredEnv('CLICTOPAY_USERNAME');
  const password = requiredEnv('CLICTOPAY_PASSWORD');

  const url = new URL('/payment/rest/getOrderStatusExtended.do', apiBaseUrl());
  url.searchParams.set('userName', userName);
  url.searchParams.set('password', password);
  url.searchParams.set('orderId', orderId);
  url.searchParams.set('language', 'fr');

  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`getOrderStatusExtended.do HTTP ${response.status}`);
  }

  return (await response.json()) as OrderStatusResponse;
}

export async function getOrderStatusByOrderNumber(orderNumber: string): Promise<OrderStatusResponse> {
  const userName = requiredEnv('CLICTOPAY_USERNAME');
  const password = requiredEnv('CLICTOPAY_PASSWORD');

  const url = new URL('/payment/rest/getOrderStatusExtended.do', apiBaseUrl());
  url.searchParams.set('userName', userName);
  url.searchParams.set('password', password);
  url.searchParams.set('orderNumber', orderNumber);
  url.searchParams.set('language', 'fr');

  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`getOrderStatusExtended.do HTTP ${response.status}`);
  }

  return (await response.json()) as OrderStatusResponse;
}

export async function initiateClicToPayPayment(input: ClicToPayInitInput): Promise<ClicToPayInitResult> {
  const orderRef = `NEXUS-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const months = input.months ?? 1;

  // Detect upgrade: if user has active PREMIUM and is buying PRO, charge difference only
  const currentSub = await prisma.subscription.findUnique({ where: { userId: input.userId } });
  const isUpgrade =
    currentSub?.status === 'ACTIVE' &&
    currentSub.currentPeriodEnd &&
    currentSub.currentPeriodEnd > new Date() &&
    normalizePlanId(currentSub.plan) === 'PREMIUM' &&
    input.plan === 'PRO';

  const amountMillimes = isUpgrade
    ? amountForUpgradeMillimes('PREMIUM', 'PRO', months)
    : amountForPlanMillimes(input.plan, months);

  await prisma.paymentTransaction.create({
    data: {
      userId: input.userId,
      plan: input.plan as SubscriptionPlan,
      amountMillimes,
      currency: 'TND',
      orderRef,
      status: 'PENDING',
      provider: 'CLICTOPAY',
      callbackPayload: { initMeta: { months, isUpgrade } },
    },
  });

  const registerPayload = await registerOrder({
    orderRef,
    amountMillimes,
    customerEmail: input.email,
  });

  if (registerPayload.errorCode && registerPayload.errorCode !== '0') {
    await prisma.paymentTransaction.update({
      where: { orderRef },
      data: {
        status: 'ERROR',
        callbackPayload: registerPayload,
      },
    });
    throw new Error(`register.do error ${registerPayload.errorCode}: ${registerPayload.errorMessage ?? 'unknown'}`);
  }

  if (!registerPayload.formUrl || !registerPayload.orderId) {
    throw new Error('Réponse register.do incomplète (formUrl/orderId).');
  }

  await prisma.paymentTransaction.update({
    where: { orderRef },
    data: {
      providerRef: registerPayload.orderId,
      callbackPayload: registerPayload,
    },
  });

  logger.info({ userId: input.userId, orderRef, providerOrderId: registerPayload.orderId, plan: input.plan }, 'clictopay.init');

  return {
    redirectUrl: registerPayload.formUrl,
    orderRef,
    providerOrderId: registerPayload.orderId,
  };
}

export async function applyClicToPayStatusToTransaction(params: {
  orderRef?: string;
  orderId?: string;
  callbackPayload?: Record<string, string>;
}): Promise<{ updated: boolean; status: 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'ERROR' }> {
  let tx = null as Awaited<ReturnType<typeof prisma.paymentTransaction.findUnique>> | null;

  if (params.orderRef) {
    tx = await prisma.paymentTransaction.findUnique({ where: { orderRef: params.orderRef } });
  }

  if (!tx && params.orderId) {
    tx = await prisma.paymentTransaction.findFirst({ where: { providerRef: params.orderId } });
  }

  if (!tx) {
    throw new Error('Transaction ClicToPay introuvable.');
  }

  // Idempotency: if already final, return current status without calling gateway
  if (tx.status === 'ACCEPTED' || tx.status === 'REFUSED') {
    logger.info({ orderRef: tx.orderRef, status: tx.status }, 'clictopay.apply_status.idempotent_skip');
    return { updated: false, status: tx.status };
  }

  const gatewayStatus = tx.providerRef
    ? await getOrderStatusByOrderId(tx.providerRef)
    : await getOrderStatusByOrderNumber(tx.orderRef);

  const mappedStatus = mapPaymentStatus(gatewayStatus);
  const previousStatus = tx.status;

  await prisma.paymentTransaction.update({
    where: { id: tx.id },
    data: {
      status: mappedStatus,
      callbackPayload: {
        callback: params.callbackPayload ?? {},
        gatewayStatus,
      },
      completedAt: mappedStatus === 'PENDING' ? null : new Date(),
    },
  });

  if (mappedStatus === 'ACCEPTED') {
    const now = new Date();
    const purchasedPlan = normalizePlanId(tx.plan);
    const initMeta = (tx.callbackPayload as Record<string, unknown>)?.initMeta as
      | { months?: number; isUpgrade?: boolean }
      | undefined;
    const months = initMeta?.months ?? 1;
    const isUpgrade = initMeta?.isUpgrade === true;

    const currentSubscription = await prisma.subscription.findUnique({
      where: { userId: tx.userId },
    });
    const currentPlan = currentSubscription ? normalizePlanId(currentSubscription.plan) : 'FREE';
    const currentEndsAt = currentSubscription?.currentPeriodEnd ?? null;
    const hasActiveCurrentPlan =
      currentSubscription?.status === 'ACTIVE' &&
      currentEndsAt !== null &&
      currentEndsAt > now;

    const purchasedIsStronger = comparePlans(purchasedPlan, currentPlan) > 0;
    const purchasedMatchesCurrent = purchasedPlan === currentPlan;

    let finalPlan: PlanId = purchasedPlan;
    let periodStart = now;
    let periodEnd = computePeriodEndForPlan(purchasedPlan, now, months);

    if (hasActiveCurrentPlan && currentEndsAt) {
      if (isUpgrade && purchasedIsStronger) {
        // Upgrade immédiat : le plan bascule tout de suite, on garde la même date de fin
        finalPlan = purchasedPlan;
        periodStart = currentSubscription.currentPeriodStart ?? now;
        periodEnd = currentEndsAt;
      } else if (purchasedIsStronger || purchasedMatchesCurrent) {
        // Renouvellement ou achat supérieur : prolonge depuis la fin actuelle
        periodStart = currentEndsAt > now ? currentEndsAt : now;
        periodEnd = computePeriodEndForPlan(purchasedPlan, periodStart, months);
      } else {
        // Le plan acheté est inférieur → on garde le plan courant
        finalPlan = currentPlan;
        periodStart = currentSubscription.currentPeriodStart ?? now;
        periodEnd = currentEndsAt;
      }
    }

    await prisma.subscription.upsert({
      where: { userId: tx.userId },
      update: {
        plan: finalPlan as SubscriptionPlan,
        status: 'ACTIVE',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId: tx.userId,
        plan: finalPlan as SubscriptionPlan,
        status: 'ACTIVE',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    // 20D.4 — Email de confirmation d'abonnement
    const user = await prisma.user.findUnique({
      where: { id: tx.userId },
      include: { profile: true },
    });
    if (user) {
      const displayName = user.profile?.displayName ?? 'Élève';
      const planLabel = finalPlan === 'PRO' ? 'Masterium' : finalPlan === 'PREMIUM' ? 'Premium' : 'Freemium';
      const amountTnd = (tx.amountMillimes / 1000).toFixed(3);
      const endDate = periodEnd.toLocaleDateString('fr-FR');
      void sendTransactionalEmail({
        to: user.email,
        subject: `Abonnement ${planLabel} activé — Nexus Réussite`,
        html: [
          `<p>Bonjour ${displayName},</p>`,
          `<p>Ton abonnement <strong>${planLabel}</strong> est désormais actif.</p>`,
          `<ul>`,
          `<li><strong>Plan :</strong> ${planLabel}</li>`,
          `<li><strong>Montant :</strong> ${amountTnd} TND</li>`,
          `<li><strong>Valable jusqu'au :</strong> ${endDate}</li>`,
          isUpgrade ? `<li><strong>Type :</strong> Upgrade (différence facturée)</li>` : '',
          months > 1 ? `<li><strong>Durée :</strong> ${months} mois</li>` : '',
          `</ul>`,
          `<p>Tu peux consulter ton statut sur <a href="https://eaf.nexusreussite.academy/pricing">la page plans</a>.</p>`,
          `<p>Bonne préparation,<br>L'équipe Nexus Réussite</p>`,
        ].filter(Boolean).join('\n'),
      }).catch(() => undefined);
    }
  }

  const isFailure = mappedStatus === 'REFUSED' || mappedStatus === 'ERROR';
  const failureAlreadyNotified = previousStatus === 'ERROR';

  if (isFailure && !failureAlreadyNotified) {
    const user = await prisma.user.findUnique({
      where: { id: tx.userId },
      include: { profile: true },
    });

    if (user) {
      const displayName = user.profile?.displayName ?? 'Élève';
      void sendTransactionalEmail({
        to: user.email,
        subject: 'Paiement Nexus non validé',
        html: `<p>Bonjour ${displayName},</p><p>Votre paiement Nexus n'a pas pu être validé. Veuillez réessayer ou contacter le support.</p>`,
      }).catch(() => undefined);
    }
  }

  logger.info({ orderRef: tx.orderRef, providerOrderId: tx.providerRef, mappedStatus }, 'clictopay.status.applied');
  return { updated: true, status: mappedStatus };
}

export async function resolvePublicPaymentStatus(params: {
  orderRef?: string;
  orderId?: string;
}): Promise<PublicPaymentStatusResult | null> {
  if (!params.orderRef && !params.orderId) {
    return null;
  }

  try {
    await applyClicToPayStatusToTransaction({
      orderRef: params.orderRef,
      orderId: params.orderId,
    });
  } catch {
    // Keep going: we can still return the last stored status if available.
  }

  const payment = params.orderRef
    ? await prisma.paymentTransaction.findUnique({ where: { orderRef: params.orderRef } })
    : await prisma.paymentTransaction.findFirst({ where: { providerRef: params.orderId } });

  if (!payment) {
    return null;
  }

  return {
    orderRef: payment.orderRef,
    status: payment.status,
    plan: normalizePlanId(payment.plan),
    amountMillimes: payment.amountMillimes,
    currency: payment.currency,
    updatedAt: payment.updatedAt,
  };
}
