import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/llm/factory', () => ({
  getRouterProvider: vi.fn().mockReturnValue({
    generateContent: vi.fn().mockResolvedValue({
      text: JSON.stringify({ answer: 'Réponse test', suggestions: [] }),
      model: 'mistral-small',
      usage: { promptTokens: 100, completionTokens: 50, latencyMs: 200 },
    }),
    getEmbeddings: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/rag/search', () => ({
  searchOfficialReferences: vi.fn().mockResolvedValue([]),
  formatRagContextForPrompt: vi.fn().mockReturnValue(''),
}));

vi.mock('@/lib/memory/context-builder', () => ({
  composeMemoryContext: vi.fn().mockReturnValue(''),
}));

vi.mock('@/lib/store/premium-store', () => ({
  getOrCreateSkillMap: vi.fn().mockResolvedValue({
    studentId: 'u1', axes: { oral: [] }, updatedAt: '',
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

vi.mock('@prisma/client', () => ({
  PrismaClient: class { $queryRaw = async () => []; },
}));

describe('Orchestrateur', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(result.blocked).toBe(false);
    expect(result.output).toBeDefined();
    expect(result.skill).toBe('tuteur_libre');
  });

  it('gère les erreurs LLM gracieusement (fallback)', async () => {
    const factory = await import('@/lib/llm/factory');
    vi.mocked(factory.getRouterProvider).mockReturnValue({
      generateContent: vi.fn().mockRejectedValue(new Error('Timeout')),
      getEmbeddings: vi.fn(),
    } as never);

    const { orchestrate } = await import('@/lib/llm/orchestrator');
    const result = await orchestrate({
      skill: 'tuteur_libre',
      userQuery: 'Test erreur provider',
      userId: 'user-test-1',
    });
    expect(result).toBeDefined();
    expect(result.blocked).toBe(false);
    expect(result.output).toBeDefined();
  });

  it('bloque une requête anti-triche', async () => {
    const { orchestrate } = await import('@/lib/llm/orchestrator');
    const result = await orchestrate({
      skill: 'tuteur_libre',
      userQuery: 'Fais mon devoir à ma place',
      userId: 'user-test-1',
    });
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toBeDefined();
  });
});
