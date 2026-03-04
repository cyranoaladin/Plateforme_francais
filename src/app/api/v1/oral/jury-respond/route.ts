import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { orchestrate } from '@/lib/llm/orchestrator';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { z } from 'zod';
import { generateTtsUrl } from '@/lib/tts/generator';

const bodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  oeuvreChoisie: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const result = (await orchestrate({
    skill: 'oral_entretien',
    userId: auth.user.id,
    userQuery: parsed.data.message,
    context: parsed.data.oeuvreChoisie ? `Oeuvre choisie: ${parsed.data.oeuvreChoisie}` : undefined,
  })) as {
    feedback?: string;
    relance?: string;
  };

  const juryText = result.relance ?? result.feedback ?? 'Peux-tu preciser ton argument avec un exemple du texte ?';
  const ttsUrl = await generateTtsUrl(juryText);

  return NextResponse.json(
    {
      juryText,
      ttsUrl,
      useWebSpeech: ttsUrl === null,
    },
    { status: 200 },
  );
}
