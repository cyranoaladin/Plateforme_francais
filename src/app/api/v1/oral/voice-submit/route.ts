import { NextResponse } from 'next/server';
import { validateCsrf } from '@/lib/security/csrf';

/**
 * Legacy audio endpoint kept only to fail loudly.
 * The active oral audio pipeline is `/api/v1/oral/session/[sessionId]/audio-turn`.
 */
export async function POST(request: Request) {
  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  return NextResponse.json(
    {
      error: 'Route audio legacy désactivée. Utilise /api/v1/oral/session/{sessionId}/audio-turn.',
    },
    { status: 410 },
  );
}
