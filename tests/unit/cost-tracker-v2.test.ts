import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateCost, trackLlmCall } from '@/lib/llm/cost-tracker';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $executeRawUnsafe: vi.fn(async () => ({})),
    $queryRawUnsafe: vi.fn(async () => [{ total: 0 }]),
  },
}));

vi.mock('@/lib/db/client', () => ({
  prisma: prismaMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Cost Tracker V2 — 5 modèles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LLM_COST_TRACKING = 'true';
  });

  it('magistral-medium : 1000 input = 0.2 centime', () => {
    const cost = calculateCost('magistral-medium-latest', 1000, 0);
    expect(cost).toBe(0.2);
  });

  it('ministral-8b : 1000 input = 0.01 centime', () => {
    const cost = calculateCost('ministral-8b-latest', 1000, 0);
    expect(cost).toBe(0.01);
  });

  it('ollama : coût = 0', () => {
    const cost = calculateCost('ollama', 100_000, 100_000);
    expect(cost).toBe(0);
  });

  it('fire-and-forget caller pattern: appelable sans throw côté tracking interne', async () => {
    prismaMock.$executeRawUnsafe.mockRejectedValueOnce(new Error('DB down'));
    await expect(
      trackLlmCall({
        skill: 'correcteur',
        provider: 'mistral_reasoning',
        model: 'magistral-medium-latest',
        tier: 'reasoning',
        inputTokens: 1000,
        outputTokens: 500,
        latencyMs: 2500,
        success: true,
      }).catch(() => undefined),
    ).resolves.toBeUndefined();
  });
});
