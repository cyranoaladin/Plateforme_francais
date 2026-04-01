import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/oral/repository', () => ({
  findOralSessionById: vi.fn(),
  finalizeOralSession: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/oral/service', () => ({
  generateOralBilan: vi.fn().mockResolvedValue({
    note: 12,
    maxNote: 20,
    mention: 'Assez bien',
    bilan_global: 'Bilan test',
    conseil_final: 'Conseil test',
  }),
}));
vi.mock('@/lib/db/repositories/evaluationRepo', () => ({
  createEvaluation: vi.fn(),
}));
vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  createMemoryEventRecord: vi.fn().mockResolvedValue(undefined),
  listMemoryEventsByUser: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/lib/db/repositories/userRepo', () => ({
  updateUserProfile: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/agents/student-modeler', () => ({
  processInteraction: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/gamification/badges', () => ({
  evaluateBadges: vi.fn().mockReturnValue({ badges: [], newBadges: [] }),
}));
vi.mock('@/lib/memory/store', () => ({
  createMemoryEvent: vi.fn().mockReturnValue({}),
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createEvaluation } from '@/lib/db/repositories/evaluationRepo';
import { evaluateBadges } from '@/lib/gamification/badges';
import { finalizeOralSession, findOralSessionById } from '@/lib/oral/repository';
import { generateOralBilan } from '@/lib/oral/service';
import { processInteraction } from '@/lib/agents/student-modeler';
import { logger } from '@/lib/logger';
import { POST } from '@/app/api/v1/oral/session/[sessionId]/end/route';

describe('POST /api/v1/oral/session/[sessionId]/end', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: {
        user: {
          id: 'user-1',
          profile: {
            badges: [],
          },
        },
      },
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      interactions: [
        {
          step: 'LECTURE',
          transcript: 'Lecture',
          duration: 90,
          createdAt: '2026-04-01T00:00:00.000Z',
          feedback: {
            feedback: 'Lecture correcte',
            score: 1.5,
            max: 2,
            points_forts: [],
            axes: [],
          },
        },
        {
          step: 'ENTRETIEN',
          transcript: 'Entretien',
          duration: 300,
          createdAt: '2026-04-01T00:05:00.000Z',
          feedback: {
            feedback: 'Entretien solide',
            score: 6.5,
            max: 99,
            points_forts: [],
            axes: ['relance', 'relance', 'precision'],
          },
        },
      ],
    } as never);
  });

  it('retourne le bilan même si createEvaluation échoue', async () => {
    vi.mocked(createEvaluation).mockRejectedValue(new Error('eval down') as never);

    const response = await POST(
      new Request('http://localhost/api/v1/oral/session/session-1/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'tok',
        },
        body: JSON.stringify({ notes: 'fin' }),
      }),
      { params: Promise.resolve({ sessionId: 'session-1' }) },
    );

    expect(response.status).toBe(200);
    expect(finalizeOralSession).toHaveBeenCalled();
    const body = await response.json();
    expect(body.note).toBe(12);
  });

  it('ne déclenche pas le badge score pour une note de 15.5', async () => {
    vi.mocked(generateOralBilan).mockResolvedValue({
      note: 15.5,
      maxNote: 20,
      mention: 'Bien',
      bilan_global: 'Bilan',
      conseil_final: 'Conseil',
    } as never);

    await POST(
      new Request('http://localhost/api/v1/oral/session/session-1/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'tok',
        },
        body: JSON.stringify({ notes: 'fin' }),
      }),
      { params: Promise.resolve({ sessionId: 'session-1' }) },
    );

    const scoreCalls = vi.mocked(evaluateBadges).mock.calls.filter(
      ([input]) => (input as { trigger?: string }).trigger === 'score',
    );
    expect(scoreCalls).toHaveLength(0);
  });

  it('déclenche le badge score pour une note de 16', async () => {
    vi.mocked(generateOralBilan).mockResolvedValue({
      note: 16,
      maxNote: 20,
      mention: 'Très bien',
      bilan_global: 'Bilan',
      conseil_final: 'Conseil',
    } as never);

    await POST(
      new Request('http://localhost/api/v1/oral/session/session-1/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'tok',
        },
        body: JSON.stringify({ notes: 'fin' }),
      }),
      { params: Promise.resolve({ sessionId: 'session-1' }) },
    );

    const scoreCalls = vi.mocked(evaluateBadges).mock.calls.filter(
      ([input]) => (input as { trigger?: string; score?: number }).trigger === 'score' && (input as { score?: number }).score === 16,
    );
    expect(scoreCalls).toHaveLength(1);
  });

  it('loggue un warning si processInteraction échoue sans bloquer le bilan', async () => {
    vi.mocked(processInteraction).mockRejectedValue(new Error('modeler down') as never);

    const response = await POST(
      new Request('http://localhost/api/v1/oral/session/session-1/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'tok',
        },
        body: JSON.stringify({ notes: 'fin' }),
      }),
      { params: Promise.resolve({ sessionId: 'session-1' }) },
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-1', userId: 'user-1' }),
      'oral.end.processInteraction.failed',
    );
  });

  it('passe des maxScore officiels et un finalFeedback JSON-serialisable', async () => {
    await POST(
      new Request('http://localhost/api/v1/oral/session/session-1/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'tok',
        },
        body: JSON.stringify({ notes: 'notes élève' }),
      }),
      { params: Promise.resolve({ sessionId: 'session-1' }) },
    );

    expect(vi.mocked(generateOralBilan)).toHaveBeenCalledWith(
      [
        { phase: 'LECTURE', score: 1.5, maxScore: 2 },
        { phase: 'ENTRETIEN', score: 6.5, maxScore: 8 },
      ],
      {
        LECTURE: { feedback: 'Lecture correcte' },
        ENTRETIEN: { feedback: 'Entretien solide' },
      },
    );

    const finalizeInput = vi.mocked(finalizeOralSession).mock.calls[0]?.[0];
    expect(finalizeInput).toBeDefined();
    expect(() => JSON.stringify(finalizeInput?.finalFeedback)).not.toThrow();
    expect(finalizeInput?.finalFeedback).toMatchObject({ notes: 'notes élève' });
  });
});
