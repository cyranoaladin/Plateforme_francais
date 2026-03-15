import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ── Mocks ── */
vi.mock('@/lib/db/client', () => ({
  prisma: {
    studentProfile: { findUnique: vi.fn() },
  },
}));
vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/oral/repository', () => ({
  findOralSessionById: vi.fn(),
  appendOralInteraction: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/oral/service', () => ({
  evaluateOralPhase: vi.fn().mockResolvedValue({
    feedback: 'Bonne lecture, débit maîtrisé.',
    score: 1.5,
    max: 2,
    points_forts: ['Articulation claire'],
    axes: ['Varier les intonations'],
    relance: null,
  }),
}));
vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  createMemoryEventRecord: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/oral/scoring', () => ({
  PHASE_MAX_SCORES: { LECTURE: 2, EXPLICATION: 8, GRAMMAIRE: 2, ENTRETIEN: 8 },
}));
vi.mock('@/lib/stt/transcriber', () => ({
  transcribeAudio: vi.fn().mockResolvedValue('Transcription de test en français.'),
}));
vi.mock('@/lib/tts/generator', () => ({
  generateTtsAudio: vi.fn().mockResolvedValue({
    audioBuffer: Buffer.from('fake-mp3-data'),
    mimeType: 'audio/mpeg',
  }),
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { prisma } from '@/lib/db/client';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { findOralSessionById, appendOralInteraction } from '@/lib/oral/repository';
import { evaluateOralPhase } from '@/lib/oral/service';
import { transcribeAudio } from '@/lib/stt/transcriber';
import { generateTtsAudio } from '@/lib/tts/generator';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { POST } from '@/app/api/v1/oral/session/[sessionId]/audio-turn/route';

const mockAuth = { user: { id: 'user-1' } };
const mockSession = {
  id: 'session-1',
  userId: 'user-1',
  oeuvre: 'Manon Lescaut',
  extrait: 'Il la vit et elle lui plut.',
  questionGrammaire: 'Analysez la coordination.',
};

function makeAudioFormData(
  step = 'LECTURE',
  audioContent = 'fake-audio-bytes',
  duration?: string,
): FormData {
  const form = new FormData();
  const blob = new Blob([audioContent], { type: 'audio/webm' });
  form.append('audio', blob, 'recording.webm');
  form.append('step', step);
  if (duration) form.append('duration', duration);
  return form;
}

function makeRequest(formData: FormData): Request {
  return new Request('http://localhost/api/v1/oral/session/session-1/audio-turn', {
    method: 'POST',
    headers: { 'X-CSRF-Token': 'tok' },
    body: formData,
  });
}

const params = { params: Promise.resolve({ sessionId: 'session-1' }) };

describe('POST /api/v1/oral/session/:id/audio-turn', () => {
  beforeEach(() => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      oeuvreChoisieEntretien: null,
    } as never);
    vi.mocked(transcribeAudio).mockResolvedValue('Transcription de test en français.');
    vi.mocked(generateTtsAudio).mockResolvedValue({
      audioBuffer: Buffer.from('fake-mp3-data'),
      mimeType: 'audio/mpeg',
    });
    vi.clearAllMocks();
  });

  /* ── Auth & CSRF ── */

  it('retourne 401 si non authentifié', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401 }),
    } as never);

    const res = await POST(makeRequest(makeAudioFormData()), params);
    expect(res.status).toBe(401);
  });

  /* ── Validation ── */

  it('retourne 400 si le champ audio est manquant', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);

    const form = new FormData();
    form.append('step', 'LECTURE');
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'X-CSRF-Token': 'tok' },
      body: form,
    });

    const res = await POST(req, params);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('audio');
  });

  it('retourne 400 si la phase est invalide', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);

    const res = await POST(makeRequest(makeAudioFormData('INVALIDE')), params);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Phase');
  });

  it("retourne 404 si la session n'appartient pas à l'utilisateur", async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue({
      ...mockSession,
      userId: 'autre-user',
    } as never);

    const res = await POST(makeRequest(makeAudioFormData()), params);
    expect(res.status).toBe(404);
  });

  /* ── STT Transcription ── */

  it('retourne fallbackToWebSpeech si la transcription échoue', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);
    vi.mocked(transcribeAudio).mockResolvedValue(null);

    const res = await POST(makeRequest(makeAudioFormData()), params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.transcript).toBeNull();
    expect(body.fallbackToWebSpeech).toBe(true);
  });

  it('retourne fallbackToWebSpeech si le STT lève une exception', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);
    vi.mocked(transcribeAudio).mockRejectedValue(new Error('Whisper down'));

    const res = await POST(makeRequest(makeAudioFormData()), params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fallbackToWebSpeech).toBe(true);
  });

  /* ── Pipeline complet ── */

  it('retourne transcript + evaluation + jury audio pour LECTURE', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);

    const res = await POST(makeRequest(makeAudioFormData('LECTURE', 'audio-data', '90')), params);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.transcript).toBe('Transcription de test en français.');
    expect(body.evaluation).toHaveProperty('feedback');
    expect(body.evaluation).toHaveProperty('score');
    expect(body.evaluation).toHaveProperty('max');
    expect(body.juryAudioBase64).toBeTruthy();
    expect(body.juryAudioMimeType).toBe('audio/mpeg');
    expect(body.fallbackToWebSpeech).toBe(false);
  });

  it('appelle evaluateOralPhase avec les bons paramètres', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      id: 'p1',
      oeuvreChoisieEntretien: 'Manon Lescaut — Abbé Prévost',
    } as never);

    await POST(makeRequest(makeAudioFormData('ENTRETIEN', 'data', '480')), params);

    expect(evaluateOralPhase).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'ENTRETIEN',
        transcript: 'Transcription de test en français.',
        extrait: mockSession.extrait,
        oeuvre: mockSession.oeuvre,
        oeuvreChoisieEntretien: 'Manon Lescaut — Abbé Prévost',
      }),
    );
  });

  /* ── TTS fallback ── */

  it('retourne fallbackToWebSpeech=true si TTS est indisponible mais évaluation réussie', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);
    vi.mocked(generateTtsAudio).mockResolvedValue(null);

    const res = await POST(makeRequest(makeAudioFormData()), params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.transcript).toBeTruthy();
    expect(body.evaluation).toHaveProperty('feedback');
    expect(body.juryAudioBase64).toBeNull();
    expect(body.fallbackToWebSpeech).toBe(true);
  });

  it('retourne evaluation même si TTS lève une exception', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);
    vi.mocked(generateTtsAudio).mockRejectedValue(new Error('TTS API down'));

    const res = await POST(makeRequest(makeAudioFormData()), params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.evaluation).toHaveProperty('feedback');
    expect(body.fallbackToWebSpeech).toBe(true);
  });

  /* ── Quota ── */

  it('retourne 429 quand le quota LLM est dépassé', async () => {
    const { QuotaExceededError } = await import('@/lib/security/llm-rate-limiter');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);
    vi.mocked(evaluateOralPhase).mockRejectedValueOnce(
      new QuotaExceededError('coach_oral', 'rpm', 10),
    );

    const res = await POST(makeRequest(makeAudioFormData()), params);
    expect(res.status).toBe(429);
  });

  /* ── Persistance ── */

  it('persiste interaction et memory event après pipeline complet', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);

    await POST(makeRequest(makeAudioFormData('EXPLICATION', 'data', '480')), params);

    expect(appendOralInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
        interaction: expect.objectContaining({
          step: 'EXPLICATION',
          transcript: 'Transcription de test en français.',
          duration: 480,
        }),
      }),
    );

    expect(createMemoryEventRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
      }),
    );
  });

  /* ── Toutes les phases ── */

  it.each(['LECTURE', 'EXPLICATION', 'GRAMMAIRE', 'ENTRETIEN'] as const)(
    'accepte la phase %s',
    async (step) => {
      vi.mocked(requireAuthenticatedUser).mockResolvedValue({
        auth: mockAuth,
        errorResponse: null,
      } as never);
      vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);

      const res = await POST(makeRequest(makeAudioFormData(step)), params);
      expect(res.status).toBe(200);
    },
  );

  /* ── Duration clamping ── */

  it('clamp la durée entre 1 et 1800', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);

    await POST(makeRequest(makeAudioFormData('LECTURE', 'data', '99999')), params);

    expect(evaluateOralPhase).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 1800 }),
    );
  });
});
