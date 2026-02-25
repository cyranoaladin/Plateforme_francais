/**
 * SM-2 Spaced Repetition Algorithm — Per cahier V2 §Sprint 5.
 *
 * Based on the SuperMemo SM-2 algorithm by Piotr Wozniak.
 * Adapted for EAF oral/écrit review items.
 *
 * Quality grades:
 *   0 = total blackout
 *   1 = incorrect, remembered upon seeing answer
 *   2 = incorrect, but easy to recall
 *   3 = correct, with serious difficulty
 *   4 = correct, with some hesitation
 *   5 = perfect recall
 */

export interface SM2Card {
  /** Number of consecutive correct reviews (quality >= 3) */
  repetition: number;
  /** Inter-repetition interval in days */
  interval: number;
  /** Easiness factor (minimum 1.3) */
  easeFactor: number;
  /** Next review date (ISO string) */
  nextReviewDate: string;
}

export interface SM2ReviewResult extends SM2Card {
  /** Whether the review was considered successful (quality >= 3) */
  success: boolean;
}

const MIN_EASE_FACTOR = 1.3;

/**
 * Create a new SM-2 card with default values.
 */
export function createCard(now: Date = new Date()): SM2Card {
  return {
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: now.toISOString(),
  };
}

/**
 * Process a review of a card with the given quality grade (0-5).
 * Returns the updated card state.
 */
export function reviewCard(
  card: SM2Card,
  quality: number,
  now: Date = new Date(),
): SM2ReviewResult {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  const success = q >= 3;

  let { repetition, interval, easeFactor } = card;

  if (success) {
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

  // Compute next review date
  const next = new Date(now);
  next.setDate(next.getDate() + interval);

  return {
    repetition,
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextReviewDate: next.toISOString(),
    success,
  };
}

/**
 * Get all cards due for review on or before the given date.
 */
export function getDueCards<T extends SM2Card>(
  cards: T[],
  now: Date = new Date(),
): T[] {
  const nowMs = now.getTime();
  return cards.filter((c) => new Date(c.nextReviewDate).getTime() <= nowMs);
}

/**
 * Map an oral phase score (0-8) to an SM-2 quality grade (0-5).
 * Used to feed oral session results into the SR engine.
 */
export function oralScoreToQuality(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  const ratio = score / maxScore;
  if (ratio >= 0.9) return 5;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.3) return 2;
  if (ratio > 0) return 1;
  return 0;
}
