import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

const VitalSchema = z.object({
  name: z.enum(['LCP', 'FID', 'CLS', 'TTFB', 'INP']),
  value: z.number().min(0).max(60000),
  id: z.string().optional(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  navigationType: z.string().optional(),
});

/**
 * POST /api/v1/metrics/vitals
 * Reçoit les Web Vitals du client et les persiste en base de données.
 */
export async function POST(request: Request) {
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
    logger.error({ error }, 'metrics.vitals.error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
