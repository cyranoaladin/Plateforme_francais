/**
 * Liveness probe — lightweight endpoint for CI/CD health checks
 * Returns 200 as soon as Next.js is up, without checking DB/Redis
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
