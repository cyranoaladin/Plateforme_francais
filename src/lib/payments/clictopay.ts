import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db/client';
import { sendTransactionalEmail } from '@/lib/email/client';
import { logger } from '@/lib/logger';

export type ClicToPayPlan = 'MONTHLY' | 'LIFETIME';

export type ClicToPayInitInput = {
  userId: string;
  plan: ClicToPayPlan;
  email: string;
};

export type ClicToPayInitResult = {
  redirectUrl: string;
  orderRef: string;
  providerOrderId: string;
};

export type PublicPaymentStatusResult = {
  orderRef: string;
  status: 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'ERROR';
  plan: 'FREE' | 'PRO' | 'MAX' | 'MONTHLY' | 'LIFETIME';
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

function callbackUrl(): string {
  return process.env.CLICTOPAY_CALLBACK_URL ?? 'https://nexusreussite.academy/api/payments/clictopay/callback';
}

function successUrl(): string {
  return process.env.CLICTOPAY_SUCCESS_URL ?? 'https://nexusreussite.academy/paiement/confirmation';
}

function failureUrl(): string {
  return process.env.CLICTOPAY_FAILURE_URL ?? 'https://nexusreussite.academy/paiement/refus';
}

function amountForPlanMillimes(plan: ClicToPayPlan): number {
  if (plan === 'MONTHLY') {
    return 14900;
  }
  return 89000;
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
  const amountMillimes = amountForPlanMillimes(input.plan);

  await prisma.paymentTransaction.create({
    data: {
      userId: input.userId,
      plan: input.plan,
      amountMillimes,
      currency: 'TND',
      orderRef,
      status: 'PENDING',
      provider: 'CLICTOPAY',
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
    const periodEnd = new Date(now);

    if (tx.plan === 'MONTHLY') {
      periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
    } else {
      periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 100);
    }

    await prisma.subscription.upsert({
      where: { userId: tx.userId },
      update: {
        plan: tx.plan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId: tx.userId,
        plan: tx.plan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });
  }

  const isFailure = mappedStatus === 'REFUSED' || mappedStatus === 'ERROR';
  const failureAlreadyNotified = previousStatus === 'REFUSED' || previousStatus === 'ERROR';

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
    plan: payment.plan,
    amountMillimes: payment.amountMillimes,
    currency: payment.currency,
    updatedAt: payment.updatedAt,
  };
}
