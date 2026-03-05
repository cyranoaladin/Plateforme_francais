import { describe, it, expect } from 'vitest';
import { computeOralScore, PHASE_MAX_SCORES } from '@/lib/oral/scoring';

describe('oral/scoring', () => {
  it('clamp chaque phase à son max officiel (2/8/2/8) et total /20', () => {
    const res = computeOralScore([
      { phase: 'LECTURE', score: 99, maxScore: PHASE_MAX_SCORES.LECTURE },
      { phase: 'EXPLICATION', score: 9, maxScore: PHASE_MAX_SCORES.EXPLICATION },
      { phase: 'GRAMMAIRE', score: 3, maxScore: PHASE_MAX_SCORES.GRAMMAIRE },
      { phase: 'ENTRETIEN', score: 8, maxScore: PHASE_MAX_SCORES.ENTRETIEN },
    ]);

    expect(res.phases.LECTURE.score).toBe(2);
    expect(res.phases.EXPLICATION.score).toBe(8);
    expect(res.phases.GRAMMAIRE.score).toBe(2);
    expect(res.phases.ENTRETIEN.score).toBe(8);
    expect(res.total).toBe(20);
    expect(res.maxTotal).toBe(20);
  });

  it('calcule correctement un score partiel', () => {
    const res = computeOralScore([
      { phase: 'LECTURE', score: 1, maxScore: 2 },
      { phase: 'EXPLICATION', score: 4, maxScore: 8 },
      { phase: 'GRAMMAIRE', score: 1, maxScore: 2 },
      { phase: 'ENTRETIEN', score: 4, maxScore: 8 },
    ]);
    expect(res.total).toBe(10);
  });
});
