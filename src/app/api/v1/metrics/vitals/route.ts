import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/security/rate-limit';

const ALLOWED_VITAL_NAMES = ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'] as const;

const VitalSchema = z.object({
  name: z.enum(ALLOWED_VITAL_NAMES),
  value: z.number().min(0).max(60000),
  id: z.string().optional(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  navigationType: z.string().optional(),
});

/**
 * POST /api/v1/metrics/vitals
 * Reçoit les Web Vitals du client et les persiste en base de données.
 * Rate-limited (100/min par IP) + graceful 202 on overload or DB failure.
 */
export async function POST(request: Request) {
  // Rate limit: 100 requests per minute per IP
  const limit = await checkRateLimit({
    request,
    key: 'vitals',
    limit: 100,
    windowMs: 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ ok: true, dropped: true, reason: 'rate_limited' }, { status: 202 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const result = VitalSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
  }

  try {
    await prisma.webVital.create({
      data: {
        name: result.data.name,
        value: result.data.value,
        rating: result.data.rating ?? null,
        navigationType: result.data.navigationType ?? null,
        userAgent: request.headers.get('user-agent') ?? 'unknown',
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Graceful degradation: accept the event but drop it if DB is unavailable
    logger.warn({ error }, 'metrics.vitals.db_unavailable');
    return NextResponse.json({ ok: true, dropped: true }, { status: 202 });
  }
}
