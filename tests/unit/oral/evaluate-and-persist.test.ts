import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockFindUnique,
  mockCheckQuota,
  mockConsumeQuota,
  mockAppendOralInteraction,
  mockCreateMemoryEventRecord,
  mockCreateMemoryEvent,
  mockEvaluateOralPhase,
  mockLoggerWarn,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCheckQuota: vi.fn(),
  mockConsumeQuota: vi.fn(),
  mockAppendOralInteraction: vi.fn(),
  mockCreateMemoryEventRecord: vi.fn(),
  mockCreateMemoryEvent: vi.fn(),
  mockEvaluateOralPhase: vi.fn(),
  mockLoggerWarn: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  prisma: {
    studentProfile: {
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock('@/lib/billing/usage', async () => {
  const actual = await vi.importActual<typeof import('@/lib/billing/usage')>('@/lib/billing/usage');
  return {
    ...actual,
    checkQuota: mockCheckQuota,
    consumeQuota: mockConsumeQuota,
  };
});

vi.mock('@/lib/oral/repository', () => ({
  appendOralInteraction: mockAppendOralInteraction,
}));

vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  createMemoryEventRecord: mockCreateMemoryEventRecord,
}));

vi.mock('@/lib/memory/store', () => ({
  createMemoryEvent: mockCreateMemoryEvent,
}));

vi.mock('@/lib/oral/service', () => ({
  evaluateOralPhase: mockEvaluateOralPhase,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: mockLoggerWarn,
  },
}));

import { QuotaExceededError } from '@/lib/billing/usage';
import type { BillingContext } from '@/lib/billing/context';
import { evaluateAndPersistPhase, PHASE_TOKEN_COST } from '@/lib/oral/evaluate-and-persist';

const billing: BillingContext = {
  planId: 'FREE',
  config: {
    id: 'FREE',
    label: 'Freemium',
    priceTnd: 0,
    billingCycle: 'free',
    rateLimits: { oralStartPerHour: 6 },
    quotas: {
      LLM_TOKENS: { limit: 8_000, period: 'day' },
    },
    flags: {},
  },
  endsAt: null,
  isActive: true,
};

const session = {
  id: 'session-1',
  userId: 'user-1',
  oeuvre: 'Manon Lescaut',
  extrait: 'Il la vit et elle lui plut.',
  questionGrammaire: 'Analysez la coordination.',
  interactions: [],
  createdAt: '2026-04-01T00:00:00.000Z',
  endedAt: null,
};

describe('evaluateAndPersistPhase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckQuota.mockResolvedValue({ allowed: true, current: 0, limit: 8_000, remaining: 8_000 });
    mockConsumeQuota.mockResolvedValue({ current: 800, limit: 8_000, remaining: 7_200 });
    mockAppendOralInteraction.mockResolvedValue(undefined);
    mockCreateMemoryEvent.mockReturnValue({ type: 'evaluation' });
    mockCreateMemoryEventRecord.mockResolvedValue(undefined);
    mockEvaluateOralPhase.mockResolvedValue({
      feedback: 'Analyse claire',
      score: 5,
      max: 8,
      points_forts: ['Structure'],
      axes: ['Précision'],
    });
    mockFindUnique.mockResolvedValue({
      oeuvreChoisieEntretien: 'On ne badine pas avec l’amour',
    });
  });

  it('ne charge pas studentProfile hors phase ENTRETIEN', async () => {
    await evaluateAndPersistPhase({
      userId: 'user-1',
      sessionId: 'session-1',
      session,
      phase: 'LECTURE',
      transcript: 'Lecture test',
      duration: 90,
      billing,
      mode: 'text',
    });

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockConsumeQuota).toHaveBeenCalledWith(
      'user-1',
      'LLM_TOKENS',
      billing.config.quotas.LLM_TOKENS,
      PHASE_TOKEN_COST.LECTURE,
    );
  });

  it('charge studentProfile pour ENTRETIEN et transmet examinerProfile', async () => {
    await evaluateAndPersistPhase({
      userId: 'user-1',
      sessionId: 'session-1',
      session,
      phase: 'ENTRETIEN',
      transcript: 'Entretien test',
      duration: 120,
      examinerProfile: 'HOSTILE',
      billing,
      mode: 'voice',
    });

    expect(mockFindUnique).toHaveBeenCalledOnce();
    expect(mockEvaluateOralPhase).toHaveBeenCalledWith(
      expect.objectContaining({
        examinerProfile: 'HOSTILE',
        oeuvreChoisieEntretien: 'On ne badine pas avec l’amour',
      }),
    );
  });

  it('refuse avant évaluation si le quota LLM est dépassé', async () => {
    mockCheckQuota.mockResolvedValue({ allowed: false, current: 8_000, limit: 8_000, remaining: 0 });

    await expect(
      evaluateAndPersistPhase({
        userId: 'user-1',
        sessionId: 'session-1',
        session,
        phase: 'EXPLICATION',
        transcript: 'Explication test',
        duration: 300,
        billing,
      }),
    ).rejects.toBeInstanceOf(QuotaExceededError);

    expect(mockEvaluateOralPhase).not.toHaveBeenCalled();
    expect(mockAppendOralInteraction).not.toHaveBeenCalled();
  });

  it('ne bloque pas le résultat si la post-consommation échoue', async () => {
    mockConsumeQuota.mockRejectedValue(new QuotaExceededError('LLM_TOKENS', 8_000, 8_000, 'day'));

    const result = await evaluateAndPersistPhase({
      userId: 'user-1',
      sessionId: 'session-1',
      session,
      phase: 'GRAMMAIRE',
      transcript: 'Grammaire test',
      duration: 120,
      billing,
    });

    expect(result.score).toBe(5);
    expect(mockAppendOralInteraction).toHaveBeenCalledOnce();
    expect(mockCreateMemoryEventRecord).toHaveBeenCalledOnce();
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', step: 'GRAMMAIRE' }),
      'oral.phase.llm_tokens.post_consume.exceeded',
    );
  });
});
