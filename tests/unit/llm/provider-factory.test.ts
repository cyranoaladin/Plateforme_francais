import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('LLM provider factory', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('retourne un provider embeddings et met en cache', async () => {
    process.env.MISTRAL_API_KEY = '';
    const { getLLMProvider, resetLLMProviderCache } = await import('@/lib/llm/factory');
    resetLLMProviderCache();
    const a = getLLMProvider();
    const b = getLLMProvider();
    expect(a).toBe(b);
  });

  it('route les skills critiques vers reasoning', async () => {
    const { getTierForSkill } = await import('@/lib/llm/factory');
    expect(getTierForSkill('correcteur')).toBe('reasoning');
    expect(getTierForSkill('quiz_maitre')).toBe('standard');
  });
});
