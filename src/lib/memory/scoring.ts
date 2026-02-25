/**
 * P0-SaaS-5 — Memory Store Scoring Helpers
 * Per ADDENDUM §Partie B, Table 33.
 *
 * Pure functions for:
 * - Weighted Moving Average (WMA) skill score updates
 * - WeakSkill severity computation
 * - Temporal decay function
 * - Global level estimation
 */

export type WeakSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SkillLevel = 'INSUFFISANT' | 'PASSABLE' | 'SATISFAISANT' | 'EXCELLENT';
export type SkillTrend = 'IMPROVING' | 'STABLE' | 'DECLINING';

/**
 * Update a SkillMapEntry score using Weighted Moving Average.
 * Per ADDENDUM: recent observations count 30% (recencyWeight).
 *
 * @param currentScore - Current normalized score [0..1]
 * @param currentObservations - Number of past observations
 * @param newObservationScore - New observation score [0..1]
 * @param recencyWeight - Weight for new observation (default 0.3)
 * @returns Updated normalized score [0..1]
 */
export function updateSkillScore(
  currentScore: number,
  currentObservations: number,
  newObservationScore: number,
  recencyWeight: number = 0.3,
): number {
  if (currentObservations === 0) return newObservationScore;
  const updated = currentScore * (1 - recencyWeight) + newObservationScore * recencyWeight;
  return Math.round(updated * 1000) / 1000;
}

/**
 * Compute the severity of a WeakSkill based on frequency and recency.
 * Per ADDENDUM: score = frequency × recency; recency ∈ [0..1].
 *
 * @param frequency - Number of times the weakness was observed
 * @param recency - Recency factor [0..1], 1.0 = very recent
 * @returns WeakSeverity level
 */
export function computeWeakSeverity(frequency: number, recency: number): WeakSeverity {
  const score = frequency * recency;
  if (score > 3.5) return 'CRITICAL';
  if (score > 2.0) return 'HIGH';
  if (score > 1.0) return 'MEDIUM';
  return 'LOW';
}

/**
 * Apply daily decay to a WeakSkill's decayedScore.
 * Per ADDENDUM: decayedScore × 0.97 per day.
 * If decayedScore < 0.3 → status should transition to IMPROVING.
 *
 * @param currentDecayedScore - Current decayed score [0..1]
 * @param daysElapsed - Number of days since last update
 * @returns { decayedScore, shouldMarkImproving }
 */
export function applyDecay(
  currentDecayedScore: number,
  daysElapsed: number,
): { decayedScore: number; shouldMarkImproving: boolean } {
  const decayFactor = Math.pow(0.97, daysElapsed);
  const decayedScore = Math.round(currentDecayedScore * decayFactor * 1000) / 1000;
  return {
    decayedScore,
    shouldMarkImproving: decayedScore < 0.3,
  };
}

/**
 * Compute skill trend from recent observation scores.
 * Compares average of last 3 observations vs previous 3.
 */
export function computeSkillTrend(
  recentScores: number[],
): SkillTrend {
  if (recentScores.length < 4) return 'STABLE';

  const last3 = recentScores.slice(-3);
  const prev3 = recentScores.slice(-6, -3);

  if (prev3.length === 0) return 'STABLE';

  const avgRecent = last3.reduce((a, b) => a + b, 0) / last3.length;
  const avgPrev = prev3.reduce((a, b) => a + b, 0) / prev3.length;
  const diff = avgRecent - avgPrev;

  if (diff > 0.1) return 'IMPROVING';
  if (diff < -0.1) return 'DECLINING';
  return 'STABLE';
}

/**
 * Compute confidence from observation count.
 * Confidence grows logarithmically, capped at 1.0 after ~20 observations.
 */
export function computeConfidence(observationCount: number): number {
  if (observationCount <= 0) return 0;
  const confidence = Math.min(1.0, Math.log(observationCount + 1) / Math.log(21));
  return Math.round(confidence * 100) / 100;
}

/**
 * Estimate global skill level from average skill scores.
 * Per ADDENDUM: maps to INSUFFISANT | PASSABLE | SATISFAISANT | EXCELLENT.
 */
export function estimateGlobalLevel(avgScore: number): SkillLevel {
  if (avgScore >= 0.8) return 'EXCELLENT';
  if (avgScore >= 0.6) return 'SATISFAISANT';
  if (avgScore >= 0.4) return 'PASSABLE';
  return 'INSUFFISANT';
}

/**
 * Check if a WeakSkill should be created/updated based on error recurrence.
 * Per ADDENDUM: same error ≥ 3 times in 30 days triggers WeakSkill.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function shouldCreateWeakSkill(errorCount: number, windowDays = 30): boolean {
  return errorCount >= 3;
}
