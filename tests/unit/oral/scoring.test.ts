import { describe, it, expect } from 'vitest';
import {
  clampPhaseScore,
  computeOralScore,
  computeMention,
  PHASE_MAX_SCORES,
  ORAL_TOTAL_MAX,
} from '@/lib/oral/scoring';

describe('clampPhaseScore', () => {
  it('clamps LECTURE to [0, 2]', () => {
    expect(clampPhaseScore('LECTURE', -1)).toBe(0);
    expect(clampPhaseScore('LECTURE', 0)).toBe(0);
    expect(clampPhaseScore('LECTURE', 1.5)).toBe(1.5);
    expect(clampPhaseScore('LECTURE', 2)).toBe(2);
    expect(clampPhaseScore('LECTURE', 5)).toBe(2);
  });

  it('clamps EXPLICATION to [0, 8]', () => {
    expect(clampPhaseScore('EXPLICATION', -1)).toBe(0);
    expect(clampPhaseScore('EXPLICATION', 7.5)).toBe(7.5);
    expect(clampPhaseScore('EXPLICATION', 10)).toBe(8);
  });

  it('clamps GRAMMAIRE to [0, 2]', () => {
    expect(clampPhaseScore('GRAMMAIRE', 2.1)).toBe(2);
    expect(clampPhaseScore('GRAMMAIRE', 1)).toBe(1);
  });

  it('clamps ENTRETIEN to [0, 8]', () => {
    expect(clampPhaseScore('ENTRETIEN', 8)).toBe(8);
    expect(clampPhaseScore('ENTRETIEN', 9)).toBe(8);
    expect(clampPhaseScore('ENTRETIEN', 0)).toBe(0);
  });

  it('rounds to 1 decimal place', () => {
    expect(clampPhaseScore('EXPLICATION', 5.555)).toBe(5.6);
    expect(clampPhaseScore('EXPLICATION', 5.551)).toBe(5.6);
    expect(clampPhaseScore('EXPLICATION', 5.549)).toBe(5.5);
  });
});

describe('computeOralScore', () => {
  it('computes a perfect score of 20/20', () => {
    const result = computeOralScore([
      { phase: 'LECTURE', score: 2, maxScore: 2 },
      { phase: 'EXPLICATION', score: 8, maxScore: 8 },
      { phase: 'GRAMMAIRE', score: 2, maxScore: 2 },
      { phase: 'ENTRETIEN', score: 8, maxScore: 8 },
    ]);
    expect(result.total).toBe(20);
    expect(result.maxTotal).toBe(ORAL_TOTAL_MAX);
    expect(result.mention).toBe('Très bien');
  });

  it('returns 0/20 with no phases submitted', () => {
    const result = computeOralScore([]);
    expect(result.total).toBe(0);
    expect(result.maxTotal).toBe(20);
    expect(result.mention).toBe('Insuffisant');
  });

  it('clamps over-max scores automatically', () => {
    const result = computeOralScore([
      { phase: 'LECTURE', score: 5, maxScore: 2 },
      { phase: 'EXPLICATION', score: 12, maxScore: 8 },
      { phase: 'GRAMMAIRE', score: 3, maxScore: 2 },
      { phase: 'ENTRETIEN', score: 10, maxScore: 8 },
    ]);
    expect(result.total).toBe(20);
    expect(result.phases.LECTURE.score).toBe(2);
    expect(result.phases.EXPLICATION.score).toBe(8);
    expect(result.phases.GRAMMAIRE.score).toBe(2);
    expect(result.phases.ENTRETIEN.score).toBe(8);
  });

  it('clamps negative scores to 0', () => {
    const result = computeOralScore([
      { phase: 'LECTURE', score: -1, maxScore: 2 },
      { phase: 'EXPLICATION', score: -5, maxScore: 8 },
      { phase: 'GRAMMAIRE', score: -2, maxScore: 2 },
      { phase: 'ENTRETIEN', score: -3, maxScore: 8 },
    ]);
    expect(result.total).toBe(0);
  });

  it('computes a realistic mid-range score', () => {
    const result = computeOralScore([
      { phase: 'LECTURE', score: 1.5, maxScore: 2 },
      { phase: 'EXPLICATION', score: 5, maxScore: 8 },
      { phase: 'GRAMMAIRE', score: 1, maxScore: 2 },
      { phase: 'ENTRETIEN', score: 5.5, maxScore: 8 },
    ]);
    expect(result.total).toBe(13);
    expect(result.mention).toBe('Assez bien');
  });

  it('each phase max matches official EAF grading', () => {
    expect(PHASE_MAX_SCORES.LECTURE).toBe(2);
    expect(PHASE_MAX_SCORES.EXPLICATION).toBe(8);
    expect(PHASE_MAX_SCORES.GRAMMAIRE).toBe(2);
    expect(PHASE_MAX_SCORES.ENTRETIEN).toBe(8);
    const sum = Object.values(PHASE_MAX_SCORES).reduce((a, b) => a + b, 0);
    expect(sum).toBe(20);
  });
});

describe('computeMention', () => {
  it.each([
    [20, 'Très bien'],
    [16, 'Très bien'],
    [15.9, 'Bien'],
    [14, 'Bien'],
    [13.9, 'Assez bien'],
    [12, 'Assez bien'],
    [11.9, 'Passable'],
    [10, 'Passable'],
    [9.9, 'Insuffisant'],
    [0, 'Insuffisant'],
  ] as const)('score %s → %s', (score: number, expected: string) => {
    expect(computeMention(score)).toBe(expected);
  });
});
