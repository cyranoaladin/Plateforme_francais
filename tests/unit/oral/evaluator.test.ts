import { describe, expect, it } from 'vitest';
import { computeOralScore } from '@/lib/oral/scoring';

describe('Oral evaluator', () => {
  it('calcule un bilan /20 cohérent', () => {
    const out = computeOralScore([
      { phase: 'LECTURE', score: 2, maxScore: 2 },
      { phase: 'EXPLICATION', score: 6, maxScore: 8 },
      { phase: 'GRAMMAIRE', score: 2, maxScore: 2 },
      { phase: 'ENTRETIEN', score: 6, maxScore: 8 },
    ]);

    expect(out.total).toBe(16);
    expect(out.maxTotal).toBe(20);
    expect(out.mention).toBe('Très bien');
  });
});
