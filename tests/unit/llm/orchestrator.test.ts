import { describe, it, expect, vi, beforeEach } from 'vitest';

const { generateContentMock, selectProviderMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
  selectProviderMock: vi.fn(),
}));

vi.mock('@/lib/llm/factory', () => ({
  selectProvider: selectProviderMock,
  recordProviderSuccess: vi.fn(),
  recordProviderError: vi.fn(),
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
    avgOralScore: 13,
    avgEcritScore: 12,
    totalSessions: 8,
    weakSkills: [],
    currentWorkMastery: null,
    recentSessionsSummary: 'oral (aujourd’hui)',
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

describe('Orchestrateur', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateContentMock.mockReset();
    selectProviderMock.mockReset();
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({ answer: 'Réponse test', suggestions: [] }),
      model: 'mistral-small',
      usage: { promptTokens: 100, completionTokens: 50, latencyMs: 200 },
    });

    selectProviderMock.mockReturnValue({
      provider: {
        generateContent: generateContentMock,
        getEmbeddings: vi.fn().mockResolvedValue([]),
      },
      tier: 'standard',
      model: 'mistral-small',
      providerName: 'mistral_standard',
    });
  });

  it('le module orchestrator se charge sans crash', async () => {
    const mod = await import('@/lib/llm/orchestrator');
    expect(mod).toBeDefined();
    expect(mod.orchestrate).toBeTypeOf('function');
  });

  it('orchestrate retourne une réponse si disponible', async () => {
    const { orchestrate } = await import('@/lib/llm/orchestrator');
    const result = await orchestrate({
      skill: 'tuteur_libre',
      userQuery: 'Comment faire un plan ?',
      userId: 'user-test-1',
    });
    expect(result).toBeDefined();
    expect(result).toMatchObject({
      answer: expect.any(String),
      citations: expect.any(Array),
      suggestions: expect.any(Array),
    });
  });

  it('gère les erreurs LLM gracieusement (fallback)', async () => {
    const factory = await import('@/lib/llm/factory');
    vi.mocked(factory.selectProvider).mockReturnValueOnce({
      provider: {
      generateContent: vi.fn().mockRejectedValue(new Error('Timeout')),
      getEmbeddings: vi.fn(),
      },
      tier: 'standard',
      model: 'mistral-small',
      providerName: 'mistral_standard',
    } as never);

    const { orchestrate } = await import('@/lib/llm/orchestrator');
    const result = await orchestrate({
      skill: 'tuteur_libre',
      userQuery: 'Test erreur provider',
      userId: 'user-test-1',
    });
    expect(result).toMatchObject({
      answer: expect.any(String),
      citations: expect.any(Array),
      suggestions: expect.any(Array),
    });
  });

  it('bloque une requête anti-triche', async () => {
    const { orchestrate } = await import('@/lib/llm/orchestrator');
    const result = await orchestrate({
      skill: 'tuteur_libre',
      userQuery: 'Fais mon devoir à ma place',
      userId: 'user-test-1',
    });
    expect(result).toMatchObject({
      blocked: true,
      category: expect.any(String),
      message: expect.any(String),
    });
  });

  it('injecte un contexte mémoire dans le prompt envoyé au provider', async () => {
    const { orchestrate } = await import('@/lib/llm/orchestrator');

    await orchestrate({
      skill: 'tuteur_libre',
      userQuery: 'Aide-moi sur mon introduction.',
      userId: 'user-test-1',
    });

    const prompt = generateContentMock.mock.calls[0]?.[0];
    expect(String(prompt)).toContain('Contexte mémoire élève');
    expect(String(prompt)).toContain('memoire active');
  });

  it('ne bloque pas un feedback valide de coach_explication à cause du garde-fou de sortie', async () => {
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({
        feedback: 'Introduction développement conclusion '.repeat(70),
        score: 6,
        max: 8,
        points_forts: ['Structure claire', 'Analyse engagée', 'Citations présentes'],
        axes: ['Préciser les effets', 'Ralentir sur les transitions', 'Nommer davantage les procédés'],
      }),
      model: 'mistral-small',
      usage: { promptTokens: 120, completionTokens: 90, latencyMs: 220 },
    });

    const { orchestrate } = await import('@/lib/llm/orchestrator');
    const result = await orchestrate({
      skill: 'coach_explication',
      userQuery: 'Voici mon explication orale sur le quipu.',
      userId: 'user-test-1',
      workId: "Lettres d'une Péruvienne",
    });

    expect(result).toMatchObject({
      feedback: expect.any(String),
      score: 6,
      max: 8,
      points_forts: expect.any(Array),
      axes: expect.any(Array),
    });
    expect(result).not.toMatchObject({
      blocked: true,
    });
  });
});
