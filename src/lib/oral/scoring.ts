import { z } from 'zod';

/**
 * Official EAF Oral scoring: 4 components, total /20.
 * - Lecture:      /2
 * - Explication:  /8
 * - Grammaire:    /2
 * - Entretien:    /8
 */

export const PHASE_MAX_SCORES = {
  LECTURE: 2,
  EXPLICATION: 8,
  GRAMMAIRE: 2,
  ENTRETIEN: 8,
} as const;

export type OralPhaseKey = keyof typeof PHASE_MAX_SCORES;

export const ORAL_TOTAL_MAX = 20;

export const oralPhaseScoreSchema = z.object({
  phase: z.enum(['LECTURE', 'EXPLICATION', 'GRAMMAIRE', 'ENTRETIEN']),
  score: z.number().min(0),
  maxScore: z.number().positive(),
});

export type PhaseScoreInput = z.infer<typeof oralPhaseScoreSchema>;

/**
 * Clamp a raw score to the [0, max] range for a given phase.
 * Returns a number rounded to 1 decimal place.
 */
export function clampPhaseScore(phase: OralPhaseKey, rawScore: number): number {
  const max = PHASE_MAX_SCORES[phase];
  const clamped = Math.max(0, Math.min(max, rawScore));
  return Math.round(clamped * 10) / 10;
}

/**
 * Compute the total oral score from individual phase scores.
 * Each phase score is clamped to its official maximum.
 * Returns { total, maxTotal, phases } with the clamped breakdown.
 */
export function computeOralScore(
  phases: PhaseScoreInput[],
): {
  total: number;
  maxTotal: number;
  phases: Record<OralPhaseKey, { score: number; max: number }>;
  mention: string;
} {
  const result: Record<OralPhaseKey, { score: number; max: number }> = {
    LECTURE: { score: 0, max: PHASE_MAX_SCORES.LECTURE },
    EXPLICATION: { score: 0, max: PHASE_MAX_SCORES.EXPLICATION },
    GRAMMAIRE: { score: 0, max: PHASE_MAX_SCORES.GRAMMAIRE },
    ENTRETIEN: { score: 0, max: PHASE_MAX_SCORES.ENTRETIEN },
  };

  for (const input of phases) {
    const key = input.phase as OralPhaseKey;
    if (key in PHASE_MAX_SCORES) {
      result[key].score = clampPhaseScore(key, input.score);
    }
  }

  const total =
    result.LECTURE.score +
    result.EXPLICATION.score +
    result.GRAMMAIRE.score +
    result.ENTRETIEN.score;

  const mention = computeMention(total);

  return { total, maxTotal: ORAL_TOTAL_MAX, phases: result, mention };
}

/**
 * Compute the official mention from a /20 score.
 */
export function computeMention(score: number): string {
  if (score >= 16) return 'Très bien';
  if (score >= 14) return 'Bien';
  if (score >= 12) return 'Assez bien';
  if (score >= 10) return 'Passable';
  return 'Insuffisant';
}
