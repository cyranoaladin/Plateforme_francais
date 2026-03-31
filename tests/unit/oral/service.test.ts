import { vi, describe, it, expect } from 'vitest';

vi.mock('@/lib/db/client', () => ({ prisma: {} }));
vi.mock('@/lib/llm/orchestrator', () => ({ orchestrate: vi.fn() }));
vi.mock('@/data/extraits-oeuvres', () => ({ EXTRAITS_OEUVRES: [] }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/lib/llm/skills', () => ({
  parseSkillOutput: vi.fn(),
  fallbackSkillOutput: vi.fn(() => ({
    feedback: 'Fallback',
    score: 0,
    max: 2,
    points_forts: [],
    axes: [],
  })),
}));
vi.mock('@/lib/security/llm-rate-limiter', () => ({
  QuotaExceededError: class QuotaExceededError extends Error {
    constructor(public scope: string) { super(`Quota exceeded: ${scope}`); }
  },
}));

import { generateOralBilan } from '@/lib/oral/service';
import { PHASE_MAX_SCORES } from '@/lib/oral/scoring';

const fullScore = [
  { phase: 'LECTURE' as const, score: 2, maxScore: PHASE_MAX_SCORES.LECTURE },
  { phase: 'EXPLICATION' as const, score: 8, maxScore: PHASE_MAX_SCORES.EXPLICATION },
  { phase: 'GRAMMAIRE' as const, score: 2, maxScore: PHASE_MAX_SCORES.GRAMMAIRE },
  { phase: 'ENTRETIEN' as const, score: 8, maxScore: PHASE_MAX_SCORES.ENTRETIEN },
];

const midScore = [
  { phase: 'LECTURE' as const, score: 1, maxScore: PHASE_MAX_SCORES.LECTURE },
  { phase: 'EXPLICATION' as const, score: 5, maxScore: PHASE_MAX_SCORES.EXPLICATION },
  { phase: 'GRAMMAIRE' as const, score: 1, maxScore: PHASE_MAX_SCORES.GRAMMAIRE },
  { phase: 'ENTRETIEN' as const, score: 5, maxScore: PHASE_MAX_SCORES.ENTRETIEN },
];

const lowLectureScore = [
  { phase: 'LECTURE' as const, score: 0, maxScore: PHASE_MAX_SCORES.LECTURE },
  { phase: 'EXPLICATION' as const, score: 7, maxScore: PHASE_MAX_SCORES.EXPLICATION },
  { phase: 'GRAMMAIRE' as const, score: 2, maxScore: PHASE_MAX_SCORES.GRAMMAIRE },
  { phase: 'ENTRETIEN' as const, score: 7, maxScore: PHASE_MAX_SCORES.ENTRETIEN },
];

const zeroScore = [
  { phase: 'LECTURE' as const, score: 0, maxScore: PHASE_MAX_SCORES.LECTURE },
  { phase: 'EXPLICATION' as const, score: 0, maxScore: PHASE_MAX_SCORES.EXPLICATION },
  { phase: 'GRAMMAIRE' as const, score: 0, maxScore: PHASE_MAX_SCORES.GRAMMAIRE },
  { phase: 'ENTRETIEN' as const, score: 0, maxScore: PHASE_MAX_SCORES.ENTRETIEN },
];

const phaseDetails = {
  LECTURE: { feedback: 'Lecture correcte.' },
  EXPLICATION: { feedback: 'Explication solide.' },
  GRAMMAIRE: { feedback: 'Grammaire maîtrisée.' },
  ENTRETIEN: { feedback: 'Entretien fluide.' },
};

describe('generateOralBilan', () => {
  it('retourne mention Très bien pour note >= 16', async () => {
    const result = await generateOralBilan(fullScore, phaseDetails);
    expect(result.note).toBe(20);
    expect(result.mention).toBe('Très bien');
    expect(result.maxNote).toBe(20);
  });

  it('note totale = somme des phases (2+8+2+8=20 max)', async () => {
    const result = await generateOralBilan(fullScore, phaseDetails);
    expect(result.note).toBe(
      result.phases.lecture.note +
      result.phases.explication.note +
      result.phases.grammaire.note +
      result.phases.entretien.note,
    );
  });

  it('mentionne la phase LECTURE dans conseil_final si score < 1', async () => {
    const result = await generateOralBilan(lowLectureScore, phaseDetails);
    expect(result.conseil_final.toLowerCase()).toContain('lecture');
  });

  it('bilan_global mentionne les 2 phases les plus faibles quand score insuffisant', async () => {
    const weakExplEntretien = [
      { phase: 'LECTURE' as const, score: 2, maxScore: PHASE_MAX_SCORES.LECTURE },
      { phase: 'EXPLICATION' as const, score: 2, maxScore: PHASE_MAX_SCORES.EXPLICATION },
      { phase: 'GRAMMAIRE' as const, score: 2, maxScore: PHASE_MAX_SCORES.GRAMMAIRE },
      { phase: 'ENTRETIEN' as const, score: 2, maxScore: PHASE_MAX_SCORES.ENTRETIEN },
    ];
    const result = await generateOralBilan(weakExplEntretien, phaseDetails);
    expect(result.bilan_global).toMatch(/explication|entretien/i);
  });

  it('retourne la mention Passable pour note 10', async () => {
    const result = await generateOralBilan(midScore, phaseDetails);
    expect(result.note).toBe(12);
    expect(result.mention).toBe('Assez bien');
  });

  it('retourne la mention Insuffisant pour note 0', async () => {
    const result = await generateOralBilan(zeroScore, phaseDetails);
    expect(result.note).toBe(0);
    expect(result.mention).toBe('Insuffisant');
  });

  it('conseil_final mentionne EXPLICATION si score < 4', async () => {
    const weakExpl = [
      { phase: 'LECTURE' as const, score: 2, maxScore: PHASE_MAX_SCORES.LECTURE },
      { phase: 'EXPLICATION' as const, score: 3, maxScore: PHASE_MAX_SCORES.EXPLICATION },
      { phase: 'GRAMMAIRE' as const, score: 2, maxScore: PHASE_MAX_SCORES.GRAMMAIRE },
      { phase: 'ENTRETIEN' as const, score: 8, maxScore: PHASE_MAX_SCORES.ENTRETIEN },
    ];
    const result = await generateOralBilan(weakExpl, phaseDetails);
    expect(result.conseil_final.toLowerCase()).toContain('explication');
  });

  it('phases du bilan correspondent aux inputs', async () => {
    const result = await generateOralBilan(midScore, phaseDetails);
    expect(result.phases.lecture.note).toBe(1);
    expect(result.phases.explication.note).toBe(5);
    expect(result.phases.grammaire.note).toBe(1);
    expect(result.phases.entretien.note).toBe(5);
  });

  it('commentaires des phases proviennent de phaseDetails', async () => {
    const result = await generateOralBilan(fullScore, phaseDetails);
    expect(result.phases.lecture.commentaire).toBe('Lecture correcte.');
    expect(result.phases.explication.commentaire).toBe('Explication solide.');
  });
});
