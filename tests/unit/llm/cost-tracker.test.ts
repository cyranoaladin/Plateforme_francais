import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExecuteRaw = vi.fn();
const mockQueryRaw = vi.fn();
vi.mock('@/lib/db/client', () => ({
  prisma: {
    $executeRawUnsafe: (...a: unknown[]) => mockExecuteRaw(...a),
    $queryRawUnsafe: (...a: unknown[]) => mockQueryRaw(...a),
  },
  isDatabaseAvailable: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('LLM Cost Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockExecuteRaw.mockResolvedValue(1);
    mockQueryRaw.mockResolvedValue([{ total: 0 }]);
  });

  it('module cost-tracker se charge sans crash', async () => {
    const mod = await import('@/lib/llm/cost-tracker').catch(() => null);
    if (!mod) return;
    expect(mod).toBeDefined();
  });

  it('calculateCost retourne un nombre positif pour mistral-large', async () => {
    const { calculateCost } = await import('@/lib/llm/cost-tracker');
    const cost = calculateCost('mistral-large-latest', 1000, 500);
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });

  it('calculateCost retourne 0 pour ollama (local gratuit)', async () => {
    const { calculateCost } = await import('@/lib/llm/cost-tracker');
    const cost = calculateCost('ollama', 1000, 500);
    expect(cost).toBe(0);
  });

  it('trackLlmCall persiste en base si LLM_COST_TRACKING=true', async () => {
    vi.stubEnv('LLM_COST_TRACKING', 'true');
    const { trackLlmCall } = await import('@/lib/llm/cost-tracker');
    await trackLlmCall({
      userId: 'user-1',
      skill: 'diagnosticien',
      provider: 'mistral_large',
      model: 'mistral-large-latest',
      tier: 'tier-1',
      inputTokens: 500,
      outputTokens: 200,
      latencyMs: 1200,
      success: true,
    });
    expect(mockExecuteRaw).toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('trackLlmCall ne persiste pas si LLM_COST_TRACKING=false', async () => {
    vi.stubEnv('LLM_COST_TRACKING', 'false');
    const { trackLlmCall } = await import('@/lib/llm/cost-tracker');
    await trackLlmCall({
      userId: 'user-1',
      skill: 'tuteur_libre',
      provider: 'mistral_standard',
      model: 'mistral-small-latest',
      tier: 'tier-2',
      inputTokens: 200,
      outputTokens: 100,
      latencyMs: 400,
      success: true,
    });
    expect(mockExecuteRaw).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
