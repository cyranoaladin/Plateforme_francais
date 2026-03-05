import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
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
 * Reçoit les Web Vitals du client et les persiste dans un fichier local.
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
    const logDir = path.join(process.cwd(), '.data', 'metrics');
    const logFile = path.join(logDir, 'vitals.log');

    await fs.mkdir(logDir, { recursive: true });

    const logEntry = {
      ...result.data,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') ?? 'unknown',
    };

    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ error }, 'metrics.vitals.error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
