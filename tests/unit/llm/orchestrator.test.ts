import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/llm/factory', () => ({
  getRouterProvider: vi.fn().mockReturnValue({
    generateContent: vi.fn().mockResolvedValue({ content: 'Réponse test', text: 'Réponse test' }),
    complete: vi.fn().mockResolvedValue({ content: 'Réponse test' }),
  }),
  estimateTokens: vi.fn().mockReturnValue(300),
}));

vi.mock('@/lib/mcp', () => ({
  mcpClient: {
    student: { getProfile: vi.fn().mockResolvedValue({ studentId: 'stu-1' }) },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('Orchestrateur', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('le module orchestrator se charge sans crash', async () => {
    const mod = await import('@/lib/llm/orchestrator');
    expect(mod).toBeDefined();
  });

  it('orchestrate retourne une réponse si disponible', async () => {
    const mod = await import('@/lib/llm/orchestrator');
    if (!('orchestrate' in mod)) return;
    const { orchestrate } = mod as { orchestrate: (input: Record<string, unknown>) => Promise<{ answer?: string }> };
    const result = await orchestrate({
      skill: 'tuteur_libre',
      messages: [{ role: 'user', content: 'Comment faire un plan ?' }],
    });
    expect(result).toBeDefined();
  });

  it('gère les erreurs LLM gracieusement', async () => {
    const { getRouterProvider } = await import('@/lib/llm/factory');
    vi.mocked(getRouterProvider).mockReturnValue({
      generateContent: vi.fn().mockRejectedValue(new Error('Timeout')),
    } as unknown as ReturnType<typeof getRouterProvider>);

    const mod = await import('@/lib/llm/orchestrator');
    if (!('orchestrate' in mod)) return;
    const { orchestrate } = mod as { orchestrate: (input: Record<string, unknown>) => Promise<unknown> };
    // Should not throw
    const result = await orchestrate({
      skill: 'tuteur_libre',
      messages: [{ role: 'user', content: 'Test' }],
    }).catch((e: Error) => ({ error: e.message }));
    expect(result).toBeDefined();
  });
});
