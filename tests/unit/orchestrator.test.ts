import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateContentMock = vi.fn();

vi.mock('@/lib/llm/factory', () => ({
  selectProvider: () => ({
    provider: {
      generateContent: generateContentMock,
    },
    tier: 'standard',
    model: 'mock-model',
    providerName: 'mistral_standard',
  }),
  recordProviderSuccess: vi.fn(),
  recordProviderError: vi.fn(),
}));

vi.mock('@/lib/llm/token-estimate', () => ({
  estimateTokens: () => 100,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/rag/search', () => ({
  searchOfficialReferences: vi.fn().mockResolvedValue([]),
  formatRagContextForPrompt: vi.fn().mockReturnValue(''),
}));

vi.mock('@/lib/memory/context-builder', () => ({
  composeMemoryContext: vi.fn().mockReturnValue('memoire active'),
  truncateToTokenBudget: vi.fn((value: string) => value),
}));

vi.mock('@/lib/memory/profile-loader', () => ({
  loadMemoryProfileForUser: vi.fn().mockResolvedValue({
    globalLevel: 'SATISFAISANT',
    avgOralScore: 12,
    avgEcritScore: 11,
    totalSessions: 5,
    weakSkills: [],
    currentWorkMastery: null,
    recentSessionsSummary: 'écrit (il y a 2j)',
  }),
}));

vi.mock('@/lib/memory/scoring', () => ({
  estimateGlobalLevel: vi.fn().mockReturnValue('SATISFAISANT'),
}));

vi.mock('@/lib/agents/student-modeler', () => ({
  processInteraction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/billing/gating', () => ({
  requirePlan: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock('@/lib/security/llm-rate-limiter', () => ({
  checkLLMQuota: vi.fn().mockResolvedValue(undefined),
  QuotaExceededError: class extends Error {},
}));

vi.mock('@/lib/llm/cost-tracker', () => ({
  trackLlmCall: vi.fn().mockResolvedValue(undefined),
}));

describe('orchestrate', () => {
  beforeEach(() => {
    generateContentMock.mockReset();
  });

  it('parse une réponse JSON valide selon le skill', async () => {
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({
        answer: 'Réponse',
        citations: [{ title: 'Doc', source_interne: 'BO 2025', excerpt: 'x' }],
        nextSteps: ['Relire la méthode'],
      }),
      model: 'mock-model',
      usage: { promptTokens: 10, completionTokens: 12, latencyMs: 20 },
    });

    const { orchestrate } = await import('@/lib/llm/orchestrator');
    const result = await orchestrate({
      skill: 'bibliothecaire',
      userQuery: 'Comment faire une intro ?',
      context: 'Source RAG',
      userId: 'u-1',
    });

    expect(result).toMatchObject({
      answer: 'Réponse',
      citations: expect.any(Array),
      nextSteps: expect.any(Array),
    });
  });

  it('retourne un fallback structuré en cas de JSON non conforme', async () => {
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({ bad: true }),
      model: 'mock-model',
    });

    const { orchestrate } = await import('@/lib/llm/orchestrator');
    const result = await orchestrate({
      skill: 'bibliothecaire',
      userQuery: 'Question',
      userId: 'u-2',
    });

    expect(result).toMatchObject({
      answer: expect.any(String),
      citations: expect.any(Array),
      nextSteps: expect.any(Array),
    });
  });
});
