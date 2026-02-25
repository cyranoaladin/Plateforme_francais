import { describe, it, expect } from 'vitest';
import { estimateTokens } from '@/lib/llm/token-estimate';

describe('estimateTokens', () => {
  it('retourne 0 pour un tableau vide', () => {
    expect(estimateTokens([])).toBe(0);
  });

  it('estime environ 1 token pour 4 caractères', () => {
    const msg = [{ content: 'A'.repeat(400) }];
    const tokens = estimateTokens(msg);
    expect(tokens).toBe(100);
  });

  it('accumule les tokens de plusieurs messages', () => {
    const single = estimateTokens([{ content: 'hello world' }]);
    const double = estimateTokens([
      { content: 'hello world' },
      { content: 'hello world' },
    ]);
    expect(double).toBeGreaterThan(single);
    expect(double).toBe(single * 2);
  });

  it('gère le contenu vide gracieusement', () => {
    const tokens = estimateTokens([{ content: '' }]);
    expect(tokens).toBe(0);
  });

  it('arrondit au plafond le nombre de tokens', () => {
    // 5 chars / 4 = 1.25 → ceil = 2
    const tokens = estimateTokens([{ content: 'abcde' }]);
    expect(tokens).toBe(2);
  });
});
