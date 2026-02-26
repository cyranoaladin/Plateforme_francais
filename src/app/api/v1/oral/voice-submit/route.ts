import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logger } from '@/lib/logger';

/**
 * POST /api/v1/oral/voice-submit
 * Accepts audio blob (webm/opus), transcribes via STT, returns transcript.
 * Used by oral simulation — student records voice answer for each phase.
 *
 * Body: multipart/form-data with field "audio" (Blob) + "sessionId" (string) + "phase" (string)
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

  const rl = await checkRateLimit({
    request,
    key: `voice:${auth.user.id}`,
    limit: 10,
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de soumissions vocales. Réessayez dans quelques secondes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const sessionId = formData.get('sessionId') as string | null;
    const phase = formData.get('phase') as string | null;

    if (!audioFile || !sessionId || !phase) {
      return NextResponse.json(
        { error: 'Champs requis: audio (Blob), sessionId (string), phase (string).' },
        { status: 400 },
      );
    }

    // Validate audio size (max 10MB)
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Fichier audio trop volumineux (max 10 Mo).' },
        { status: 413 },
      );
    }

    // STT transcription — delegated to stt module
    const { transcribeAudio } = await import('@/lib/stt/transcriber');
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = audioFile.type || 'audio/webm';

    const transcript = await transcribeAudio(buffer, mimeType, {
      language: 'fr',
    });

    // No server-side STT configured — tell frontend to use Web Speech API
    if (transcript === null) {
      return NextResponse.json({
        sessionId,
        phase,
        transcript: null,
        fallbackToWebSpeech: true,
      });
    }

    logger.info({
      userId: auth.user.id,
      sessionId,
      phase,
      audioSize: audioFile.size,
      transcriptLength: transcript.text.length,
    }, 'voice_submit.transcribed');

    return NextResponse.json({
      sessionId,
      phase,
      transcript: transcript.text,
      confidence: transcript.confidence ?? null,
      durationMs: transcript.durationMs ?? null,
      fallbackToWebSpeech: false,
    });
  } catch (err) {
    logger.error({ err, userId: auth.user.id }, 'voice_submit.error');
    return NextResponse.json(
      { error: 'Transcription indisponible. Réessayez ou saisissez votre réponse manuellement.' },
      { status: 500 },
    );
  }
}
