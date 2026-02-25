import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';

/**
 * GET /api/v1/badges/list
 */
export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const badges: string[] = auth.user.profile?.badges ?? [];

  return NextResponse.json({ badges }, { status: 200 });
}
