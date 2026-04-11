/**
 * C3 FIX: Cron job pour expiration automatique des abonnements
 * Passe les abonnements ACTIVE → PAST_DUE quand currentPeriodEnd < now
 * Passe PAST_DUE → CANCELED après 7 jours de grâce
 * 
 * Protection: CRON_SECRET requis dans header x-cron-secret ou Authorization Bearer
 */

import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

const GRACE_PERIOD_DAYS = 7;

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    logger.error('CRON_SECRET not configured');
    return NextResponse.json({ error: 'Configuration serveur manquante.' }, { status: 500 });
  }

  const secret = request.headers.get('x-cron-secret')
    ?? (request.headers.get('authorization')?.startsWith('Bearer ') ? request.headers.get('authorization')!.slice(7) : '');

  if (
    secret.length !== expected.length ||
    !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const now = new Date();
  const gracePeriodEnd = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  try {
    // Étape 1: ACTIVE → PAST_DUE (période expirée)
    const pastDueResult = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { lt: now },
      },
      data: {
        status: 'PAST_DUE',
        updatedAt: now,
      },
    });

    // Étape 2: PAST_DUE → CANCELED (après période de grâce)
    const canceledResult = await prisma.subscription.updateMany({
      where: {
        status: 'PAST_DUE',
        currentPeriodEnd: { lt: gracePeriodEnd },
      },
      data: {
        status: 'CANCELED',
        updatedAt: now,
      },
    });

    logger.info({
      pastDueCount: pastDueResult.count,
      canceledCount: canceledResult.count,
    }, 'cron.subscription_expiry');

    return NextResponse.json({
      ok: true,
      transitionedToPastDue: pastDueResult.count,
      transitionedToCanceled: canceledResult.count,
      gracePeriodDays: GRACE_PERIOD_DAYS,
    });
  } catch (error) {
    logger.error({ error }, 'cron.subscription_expiry_failed');
    return NextResponse.json(
      { error: 'Échec du traitement des expirations.' },
      { status: 500 }
    );
  }
}
