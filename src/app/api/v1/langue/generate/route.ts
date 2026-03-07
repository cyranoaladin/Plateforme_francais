import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { langueGenerateBodySchema } from '@/lib/validation/schemas';
import { parseJsonBody } from '@/lib/validation/request';
import { buildLangueExerciseSeries } from '@/lib/langue/exercise-bank';

/**
 * POST /api/v1/langue/generate
 * Body: { theme?: 'subordonnees'|'relations_logiques'|'systeme_verbal'|'mixte', count?: 1-10 }
 * Builds a local, varied exercise series for the grammar workshop.
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

  const parsed = await parseJsonBody(request, langueGenerateBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const theme = parsed.data.theme ?? 'mixte';
  const count = parsed.data.count ?? 5;
  const exercises = buildLangueExerciseSeries(theme, count);

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'interaction',
      feature: 'atelier_langue_generate',
      path: '/atelier-langue',
      payload: {
        theme,
        count: exercises.length,
      },
    }),
  ).catch(() => undefined);

  return NextResponse.json(
    {
      exercises,
      source: 'local_bank',
    },
    { status: 200 },
  );
}
