import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLlmTimeoutMs } from '@/lib/llm/timeout';

describe('getLlmTimeoutMs', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('retourne la valeur de fallback sans override global', () => {
    expect(getLlmTimeoutMs(60_000)).toBe(60_000);
  });

  it('utilise LLM_TIMEOUT_MS quand il est defini', () => {
    vi.stubEnv('LLM_TIMEOUT_MS', '30000');
    expect(getLlmTimeoutMs(60_000)).toBe(30_000);
  });
});
