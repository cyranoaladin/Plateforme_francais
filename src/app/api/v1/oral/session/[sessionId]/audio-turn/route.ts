import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { logger } from '@/lib/logger';
import { createMemoryEvent } from '@/lib/memory/store';
import { appendOralInteraction, findOralSessionById } from '@/lib/oral/repository';
import { evaluateOralPhase } from '@/lib/oral/service';
import { PHASE_MAX_SCORES, type OralPhaseKey } from '@/lib/oral/scoring';
import { validateCsrf } from '@/lib/security/csrf';
import { QuotaExceededError } from '@/lib/security/llm-rate-limiter';
import { transcribeAudio } from '@/lib/stt/transcriber';
import { generateTtsAudio } from '@/lib/tts/generator';

const VALID_PHASES = new Set(['LECTURE', 'EXPLICATION', 'GRAMMAIRE', 'ENTRETIEN']);
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB (Whisper limit)

/**
 * POST /api/v1/oral/session/{sessionId}/audio-turn
 *
 * Multipart form: { audio: File, step: string, duration?: number }
 *
 * Full audio turn pipeline:
 * 1. Receive audio blob
 * 2. Transcribe via Whisper (server STT)
 * 3. Evaluate the oral phase via LLM
 * 4. Generate jury audio response via TTS (if available)
 * 5. Persist interaction + memory event
 * 6. Return { transcript, evaluation, juryAudioBase64?, fallbackToWebSpeech }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  // ── Parse multipart form ──
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Données du formulaire invalides.' }, { status: 400 });
  }

  const audio = form.get('audio');
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: 'Champ audio manquant.' }, { status: 400 });
  }

  if (audio.size > MAX_AUDIO_SIZE) {
    return NextResponse.json({ error: 'Fichier audio trop volumineux (max 25 Mo).' }, { status: 413 });
  }

  const stepRaw = form.get('step');
  if (typeof stepRaw !== 'string' || !VALID_PHASES.has(stepRaw)) {
    return NextResponse.json({ error: 'Phase invalide (LECTURE, EXPLICATION, GRAMMAIRE, ENTRETIEN).' }, { status: 400 });
  }
  const phase = stepRaw as OralPhaseKey;

  const durationRaw = form.get('duration');
  const duration = durationRaw ? Math.min(1800, Math.max(1, parseInt(String(durationRaw), 10) || 60)) : 60;
  const examinerProfileRaw = form.get('examinerProfile');
  const examinerProfile =
    examinerProfileRaw === 'BIENVEILLANT'
    || examinerProfileRaw === 'NEUTRE'
    || examinerProfileRaw === 'HOSTILE'
    || examinerProfileRaw === 'RANDOM'
      ? examinerProfileRaw
      : 'NEUTRE';

  // ── Validate session ──
  const { sessionId } = await params;
  const session = await findOralSessionById(sessionId);
  if (!session || session.userId !== auth.user.id) {
    return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
  }

  if (!(phase in PHASE_MAX_SCORES)) {
    return NextResponse.json({ error: 'Phase invalide.' }, { status: 400 });
  }

  // ── 1. STT: Transcribe audio ──
  const mimeType = audio.type || 'audio/webm';
  const audioBuffer = Buffer.from(await audio.arrayBuffer());
  const audioSizeBytes = audioBuffer.length;
  const turnStartMs = Date.now();

  let transcript: string | null;
  let sttLatencyMs = 0;
  const sttStartMs = Date.now();
  try {
    transcript = await transcribeAudio(audioBuffer, mimeType, {
      language: 'fr',
      prompt: 'Oral EAF français, expression linéaire et vocabulaire littéraire.',
    });
    sttLatencyMs = Date.now() - sttStartMs;
  } catch (err) {
    sttLatencyMs = Date.now() - sttStartMs;
    logger.error({ err, sessionId, phase, audioSizeBytes, sttLatencyMs }, 'audio-turn.stt.error');
    transcript = null;
  }

  if (!transcript) {
    logger.info(
      { sessionId, phase, audioSizeBytes, sttLatencyMs, fallback: true },
      'audio-turn.fallback',
    );
    return NextResponse.json(
      { transcript: null, fallbackToWebSpeech: true },
      { status: 200 },
    );
  }

  // ── 2. Evaluate oral phase ──
  const profile = await prisma.studentProfile.findUnique({ where: { userId: auth.user.id } });

  let evaluation;
  try {
    evaluation = await evaluateOralPhase({
      phase,
      transcript,
      extrait: session.extrait,
      questionGrammaire: session.questionGrammaire,
      oeuvre: session.oeuvre,
      duration,
      userId: auth.user.id,
      oeuvreChoisieEntretien: profile?.oeuvreChoisieEntretien ?? null,
      examinerProfile: phase === 'ENTRETIEN' ? examinerProfile : null,
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: `Limite atteinte pour cette évaluation orale (${error.scope}). Réessayez plus tard.` },
        { status: 429 },
      );
    }
    throw error;
  }

  // ── 3. TTS: Generate jury audio for feedback ──
  const feedbackText = evaluation.feedback ?? '';
  let juryAudioBase64: string | null = null;
  let juryAudioMimeType: string | null = null;
  let ttsLatencyMs = 0;

  if (feedbackText.length > 0) {
    const ttsStartMs = Date.now();
    try {
      const ttsResult = await generateTtsAudio(feedbackText);
      ttsLatencyMs = Date.now() - ttsStartMs;
      if (ttsResult) {
        juryAudioBase64 = ttsResult.audioBuffer.toString('base64');
        juryAudioMimeType = ttsResult.mimeType;
      }
    } catch (err) {
      ttsLatencyMs = Date.now() - ttsStartMs;
      logger.warn({ err, sessionId, phase, ttsLatencyMs }, 'audio-turn.tts.error');
      // TTS failure is non-blocking — client falls back to browser speechSynthesis
    }
  }

  // ── 4. Persist interaction ──
  await appendOralInteraction({
    sessionId,
    interaction: {
      step: phase,
      transcript,
      duration,
      feedback: evaluation,
      createdAt: new Date().toISOString(),
    },
  });

  // ── 5. Memory event ──
  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'evaluation',
      feature: `oral_phase_${phase.toLowerCase()}`,
      path: '/atelier-oral',
      payload: {
        sessionId,
        step: phase,
        score: evaluation.score,
        max: evaluation.max,
        duration,
        mode: 'voice',
      },
    }),
  ).catch(() => undefined);

  // ── 6. Instrumentation log ──
  const totalLatencyMs = Date.now() - turnStartMs;
  logger.info(
    {
      sessionId,
      phase,
      audioSizeBytes,
      sttLatencyMs,
      ttsLatencyMs,
      totalLatencyMs,
      sttOk: true,
      ttsOk: juryAudioBase64 !== null,
      fallback: false,
    },
    'audio-turn.completed',
  );

  // ── 7. Response ──
  return NextResponse.json(
    {
      transcript,
      evaluation,
      juryAudioBase64,
      juryAudioMimeType,
      fallbackToWebSpeech: juryAudioBase64 === null,
    },
    { status: 200 },
  );
}
