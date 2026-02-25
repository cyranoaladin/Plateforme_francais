import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { evaluateBadges } from '@/lib/gamification/badges';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { badgeEvaluateBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/badges/evaluate
 * Body: { trigger?: 'first_copy'|'quiz_perfect'|'oral_done'|'score', score?: number }
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, badgeEvaluateBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const timeline = await listMemoryEventsByUser(auth.user.id, 500);

  const result = evaluateBadges({
    profile: auth.user.profile,
    trigger: parsed.data.trigger,
    score: parsed.data.score,
    timeline,
  });

  await updateUserProfile(auth.user.id, {
    ...auth.user.profile,
    badges: result.badges,
  });

  return NextResponse.json(result, { status: 200 });
}
