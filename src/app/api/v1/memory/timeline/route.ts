import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';

export async function GET(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number.parseInt(searchParams.get('limit') ?? '50', 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 200)
    : 50;

  const timeline = await listMemoryEventsByUser(auth.user.id, limit);

  const weakSignals = timeline
    .filter((event) => event.type === 'evaluation')
    .flatMap((event) => {
      const weak = event.payload?.weakSkills;
      return Array.isArray(weak) ? weak : [];
    })
    .reduce<Record<string, number>>((acc, skill) => {
      acc[skill] = (acc[skill] ?? 0) + 1;
      return acc;
    }, {});

  return NextResponse.json(
    {
      profile: auth.user.profile,
      timeline,
      weakSignals,
    },
    { status: 200 },
  );
}
