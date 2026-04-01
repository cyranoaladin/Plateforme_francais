import { describe, it, expect } from 'vitest';
import {
  computeOralScore,
  computeMention,
  clampPhaseScore,
  PHASE_MAX_SCORES,
  ORAL_TOTAL_MAX,
  oralPhaseScoreSchema,
} from '@/lib/oral/scoring';

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

  it('clamp à 0 si score négatif', () => {
    const res = computeOralScore([
      { phase: 'LECTURE', score: -5, maxScore: PHASE_MAX_SCORES.LECTURE },
      { phase: 'EXPLICATION', score: -1, maxScore: PHASE_MAX_SCORES.EXPLICATION },
      { phase: 'GRAMMAIRE', score: -3, maxScore: PHASE_MAX_SCORES.GRAMMAIRE },
      { phase: 'ENTRETIEN', score: -2, maxScore: PHASE_MAX_SCORES.ENTRETIEN },
    ]);
    expect(res.phases.LECTURE.score).toBe(0);
    expect(res.phases.EXPLICATION.score).toBe(0);
    expect(res.phases.GRAMMAIRE.score).toBe(0);
    expect(res.phases.ENTRETIEN.score).toBe(0);
    expect(res.total).toBe(0);
  });

  it('total = 20 si toutes phases au maximum', () => {
    const res = computeOralScore([
      { phase: 'LECTURE', score: PHASE_MAX_SCORES.LECTURE, maxScore: PHASE_MAX_SCORES.LECTURE },
      { phase: 'EXPLICATION', score: PHASE_MAX_SCORES.EXPLICATION, maxScore: PHASE_MAX_SCORES.EXPLICATION },
      { phase: 'GRAMMAIRE', score: PHASE_MAX_SCORES.GRAMMAIRE, maxScore: PHASE_MAX_SCORES.GRAMMAIRE },
      { phase: 'ENTRETIEN', score: PHASE_MAX_SCORES.ENTRETIEN, maxScore: PHASE_MAX_SCORES.ENTRETIEN },
    ]);
    expect(res.total).toBe(ORAL_TOTAL_MAX);
    expect(res.maxTotal).toBe(ORAL_TOTAL_MAX);
  });

  it('phases manquantes valent 0 par défaut', () => {
    const res = computeOralScore([
      { phase: 'LECTURE', score: 2, maxScore: 2 },
    ]);
    expect(res.phases.EXPLICATION.score).toBe(0);
    expect(res.phases.GRAMMAIRE.score).toBe(0);
    expect(res.phases.ENTRETIEN.score).toBe(0);
    expect(res.total).toBe(2);
  });
});

describe('clampPhaseScore', () => {
  it('clamp au max si score > max', () => {
    expect(clampPhaseScore('LECTURE', 10)).toBe(2);
    expect(clampPhaseScore('EXPLICATION', 99)).toBe(8);
    expect(clampPhaseScore('ENTRETIEN', 100)).toBe(8);
  });

  it('clamp à 0 si score négatif', () => {
    expect(clampPhaseScore('LECTURE', -1)).toBe(0);
    expect(clampPhaseScore('GRAMMAIRE', -5)).toBe(0);
  });

  it('retourne la valeur exacte si dans la plage', () => {
    expect(clampPhaseScore('LECTURE', 1)).toBe(1);
    expect(clampPhaseScore('EXPLICATION', 5)).toBe(5);
  });
});

describe('computeMention', () => {
  it('Très bien pour >= 16', () => {
    expect(computeMention(16)).toBe('Très bien');
    expect(computeMention(20)).toBe('Très bien');
  });

  it('Bien pour >= 14 et < 16', () => {
    expect(computeMention(14)).toBe('Bien');
    expect(computeMention(15)).toBe('Bien');
  });

  it('Assez bien pour >= 12 et < 14', () => {
    expect(computeMention(12)).toBe('Assez bien');
    expect(computeMention(13)).toBe('Assez bien');
  });

  it('Passable pour >= 10 et < 12', () => {
    expect(computeMention(10)).toBe('Passable');
    expect(computeMention(11)).toBe('Passable');
  });

  it('Insuffisant pour < 10', () => {
    expect(computeMention(0)).toBe('Insuffisant');
    expect(computeMention(9)).toBe('Insuffisant');
  });
});

describe('oralPhaseScoreSchema', () => {
  it('accepte uniquement les maxScore officiels EAF', () => {
    expect(() =>
      oralPhaseScoreSchema.parse({ phase: 'LECTURE', score: 1, maxScore: 2 }),
    ).not.toThrow();
    expect(() =>
      oralPhaseScoreSchema.parse({ phase: 'EXPLICATION', score: 4, maxScore: 8 }),
    ).not.toThrow();
    expect(() =>
      oralPhaseScoreSchema.parse({ phase: 'LECTURE', score: 1, maxScore: 3 }),
    ).toThrow(/valeur officielle EAF/);
  });
});
