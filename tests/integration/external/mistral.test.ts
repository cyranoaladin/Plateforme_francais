import { describe, expect, it, vi } from 'vitest';

const selectProviderMock = vi.fn();
vi.mock('@/lib/llm/router', async (orig) => {
  const mod = await orig<typeof import('@/lib/llm/router')>();
  return {
    ...mod,
    selectProvider: selectProviderMock,
  };
});

describe('mistral external integration (mock)', () => {
  it('sélectionne le tier reasoning pour correcteur', async () => {
    const { getTierForSkill } = await import('@/lib/llm/factory');
    expect(getTierForSkill('correcteur')).toBe('reasoning');
  });
});
