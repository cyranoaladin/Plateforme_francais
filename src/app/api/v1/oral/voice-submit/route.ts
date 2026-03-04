import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { orchestrate } from '@/lib/llm/orchestrator';
import { validateCsrf } from '@/lib/security/csrf';
import { transcribeAudio } from '@/lib/stt/transcriber';

export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const form = await request.formData();
  const audio = form.get('audio');
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: 'Champ audio manquant.' }, { status: 400 });
  }

  const mimeType = audio.type || 'audio/webm';
  const bytes = Buffer.from(await audio.arrayBuffer());

  const transcript = await transcribeAudio(bytes, mimeType, {
    language: 'fr',
    prompt: 'Oral EAF francais, expression lineaire et vocabulaire litteraire.',
  });

  if (!transcript) {
    return NextResponse.json(
      { transcript: null, fallbackToWebSpeech: true },
      { status: 200 },
    );
  }

  const feedback = (await orchestrate({
    skill: 'coach_lecture',
    userId: auth.user.id,
    userQuery: transcript,
  })) as {
    feedback?: string;
    score?: number;
    max?: number;
  };

  return NextResponse.json(
    {
      transcript,
      feedback: feedback.feedback ?? 'Retour indisponible.',
      score: typeof feedback.score === 'number' ? feedback.score : 0,
      max: typeof feedback.max === 'number' ? feedback.max : 2,
      fallbackToWebSpeech: false,
    },
    { status: 200 },
  );
}
