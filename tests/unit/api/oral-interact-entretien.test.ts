import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/billing/context', () => ({
  getBillingContext: vi.fn(),
}));
vi.mock('@/lib/billing/usage', () => ({
  QuotaExceededError: class QuotaExceededError extends Error {
    constructor(...args: unknown[]) {
      void args;
      super('quota exceeded');
    }
  },
}));
vi.mock('@/lib/oral/repository', () => ({
  findOralSessionById: vi.fn(),
}));
vi.mock('@/lib/oral/evaluate-and-persist', () => ({
  PHASE_TOKEN_COST: {
    LECTURE: 200,
    EXPLICATION: 800,
    GRAMMAIRE: 300,
    ENTRETIEN: 1000,
  },
  evaluateAndPersistPhase: vi.fn().mockResolvedValue({
    feedback: 'Très bien.',
    score: 7,
    max: 8,
    points_forts: [],
    axes: [],
  }),
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getBillingContext } from '@/lib/billing/context';
import { QuotaExceededError as BillingQuotaExceededError } from '@/lib/billing/usage';
import { findOralSessionById } from '@/lib/oral/repository';
import { evaluateAndPersistPhase } from '@/lib/oral/evaluate-and-persist';
import { POST } from '@/app/api/v1/oral/session/[sessionId]/interact/route';

const mockAuth = { user: { id: 'user-1' } };
const mockSession = {
  id: 'session-1',
  userId: 'user-1',
  oeuvre: 'Manon Lescaut',
  extrait: 'Il était une fois...',
  questionGrammaire: 'Analysez la subordonnée relative.',
};

describe('POST /api/v1/oral/session/:id/interact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(getBillingContext).mockResolvedValue({
      config: { quotas: { LLM_TOKENS: { limit: 8_000, period: 'day' } } },
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);
  });

  it('transmet le contexte utile au helper partagé pour ENTRETIEN', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'ENTRETIEN',
        transcript: 'Je présente mon œuvre.',
        duration: 240,
        examinerProfile: 'HOSTILE',
      }),
    });

    await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });

    expect(evaluateAndPersistPhase).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        sessionId: 'session-1',
        session: mockSession,
        phase: 'ENTRETIEN',
        transcript: 'Je présente mon œuvre.',
        duration: 240,
        examinerProfile: 'HOSTILE',
        billing: expect.any(Object),
        mode: 'text',
      }),
    );
  });

  it("retourne 404 si la session n'appartient pas à l'utilisateur", async () => {
    vi.mocked(findOralSessionById).mockResolvedValue({
      ...mockSession,
      userId: 'autre-user',
    } as never);

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'ENTRETIEN',
        transcript: 'Test.',
        duration: 100,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(res.status).toBe(404);
    expect(evaluateAndPersistPhase).not.toHaveBeenCalled();
  });

  it('retourne 409 si la session est déjà finalisée', async () => {
    vi.mocked(findOralSessionById).mockResolvedValue({
      ...mockSession,
      status: 'FINALIZED',
    } as never);

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'ENTRETIEN',
        transcript: 'Session close.',
        duration: 100,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(res.status).toBe(409);
    expect(evaluateAndPersistPhase).not.toHaveBeenCalled();
  });

  it('retourne 400 si la phase est invalide', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'PHASE_INEXISTANTE',
        transcript: 'Test.',
        duration: 100,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(res.status).toBe(400);
  });

  it('retourne 200 avec le résultat du helper pour LECTURE', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'LECTURE',
        transcript: 'Lecture fluide.',
        duration: 90,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('feedback');
    expect(body).toHaveProperty('score');
  });

  it('retourne 429 quand le moteur LLM refuse la requête', async () => {
    const { QuotaExceededError } = await import('@/lib/security/llm-rate-limiter');
    vi.mocked(evaluateAndPersistPhase).mockRejectedValueOnce(
      new QuotaExceededError('coach_oral', 'rpm', 10),
    );

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'ENTRETIEN',
        transcript: 'Je présente mon œuvre.',
        duration: 240,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(res.status).toBe(429);
  });

  it('retourne 402 si le quota LLM_TOKENS est dépassé avant évaluation', async () => {
    vi.mocked(evaluateAndPersistPhase).mockRejectedValueOnce(
      new BillingQuotaExceededError('LLM_TOKENS', 8_000, 8_000, 'day'),
    );

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'ENTRETIEN',
        transcript: 'Quota dépassé.',
        duration: 240,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(res.status).toBe(402);
  });
});
