import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMistralTimeoutMs } from '@/lib/llm/adapters/mistral';

describe('getMistralTimeoutMs', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('alloue un timeout plus long au tier reasoning', () => {
    expect(getMistralTimeoutMs('magistral-medium-latest')).toBe(90_000);
  });

  it('garde un timeout standard pour mistral-small', () => {
    expect(getMistralTimeoutMs('mistral-small-latest')).toBe(30_000);
  });

  it('permet un override d environnement pour le reasoning', () => {
    vi.stubEnv('MISTRAL_REASONING_TIMEOUT_MS', '120000');
    expect(getMistralTimeoutMs('magistral-medium-latest')).toBe(120_000);
  });

  it('conserve le timeout par modele tant que LLM_TIMEOUT_MS n est pas applique plus haut', () => {
    vi.stubEnv('LLM_TIMEOUT_MS', '45000');
    expect(getMistralTimeoutMs('mistral-small-latest')).toBe(30_000);
  });
});
