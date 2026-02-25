/**
 * Oral EAF session state machine.
 *
 * Valid transitions:
 *   DRAFT   → PREP      (tirage done, prep starts)
 *   PREP    → PASSAGE   (prep time over or user submits prep)
 *   PASSAGE → DONE      (all 4 phases submitted + finalize)
 *
 * Timers (server-enforced):
 *   PREP phase:    30 minutes max
 *   PASSAGE phase: 20 minutes max
 */

export type OralStatus = 'DRAFT' | 'PREP' | 'PASSAGE' | 'DONE';

export const PREP_DURATION_MS = 30 * 60 * 1000;
export const PASSAGE_DURATION_MS = 20 * 60 * 1000;

const VALID_TRANSITIONS: Record<OralStatus, OralStatus[]> = {
  DRAFT: ['PREP'],
  PREP: ['PASSAGE'],
  PASSAGE: ['DONE'],
  DONE: [],
};

/**
 * Check if a transition from `current` to `next` is valid.
 */
export function canTransition(current: OralStatus, next: OralStatus): boolean {
  return VALID_TRANSITIONS[current].includes(next);
}

/**
 * Validate and return the next status, or throw if invalid.
 */
export function transition(current: OralStatus, next: OralStatus): OralStatus {
  if (!canTransition(current, next)) {
    throw new OralTransitionError(current, next);
  }
  return next;
}

/**
 * Compute remaining time in milliseconds for the current phase.
 * Returns 0 if phase is expired or not applicable.
 */
export function remainingTimeMs(
  status: OralStatus,
  phaseStartedAt: Date | null,
  now: Date = new Date(),
): number {
  if (!phaseStartedAt) return 0;

  const durationMs = status === 'PREP' ? PREP_DURATION_MS : status === 'PASSAGE' ? PASSAGE_DURATION_MS : 0;
  if (durationMs === 0) return 0;

  const elapsed = now.getTime() - phaseStartedAt.getTime();
  return Math.max(0, durationMs - elapsed);
}

/**
 * Check if the current timed phase has expired.
 */
export function isPhaseExpired(
  status: OralStatus,
  phaseStartedAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (status !== 'PREP' && status !== 'PASSAGE') return false;
  return remainingTimeMs(status, phaseStartedAt, now) === 0;
}

export class OralTransitionError extends Error {
  constructor(
    public readonly from: OralStatus,
    public readonly to: OralStatus,
  ) {
    super(`Invalid oral session transition: ${from} → ${to}`);
    this.name = 'OralTransitionError';
  }
}
