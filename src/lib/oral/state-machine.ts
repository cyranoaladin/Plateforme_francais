/**
 * Oral EAF session state machine — V2.
 *
 * 7 states per cahier des charges V2:
 *   DRAFT → PREP_RUNNING → PREP_ENDED → PASSAGE_RUNNING → PASSAGE_DONE → FINALIZED
 *   Any non-terminal state → ABANDONED
 *
 * Modes:
 *   SIMULATION:    timers locked, no back-navigation (exam conditions)
 *   FREE_PRACTICE: timers optional, can revisit phases
 *
 * Timers (server-enforced in SIMULATION mode):
 *   PREP phase:    30 minutes max
 *   PASSAGE phase: 20 minutes max
 */

export type OralStatus =
  | 'DRAFT'
  | 'PREP_RUNNING'
  | 'PREP_ENDED'
  | 'PASSAGE_RUNNING'
  | 'PASSAGE_DONE'
  | 'FINALIZED'
  | 'ABANDONED';

export type OralMode = 'SIMULATION' | 'FREE_PRACTICE';

export const PREP_DURATION_MS = 30 * 60 * 1000;
export const PASSAGE_DURATION_MS = 20 * 60 * 1000;

const VALID_TRANSITIONS: Record<OralStatus, OralStatus[]> = {
  DRAFT: ['PREP_RUNNING', 'ABANDONED'],
  PREP_RUNNING: ['PREP_ENDED', 'ABANDONED'],
  PREP_ENDED: ['PASSAGE_RUNNING', 'ABANDONED'],
  PASSAGE_RUNNING: ['PASSAGE_DONE', 'ABANDONED'],
  PASSAGE_DONE: ['FINALIZED', 'ABANDONED'],
  FINALIZED: [],
  ABANDONED: [],
};

/** Terminal states that cannot transition further. */
export const TERMINAL_STATES: ReadonlySet<OralStatus> = new Set(['FINALIZED', 'ABANDONED']);

/**
 * Check if a transition from `current` to `next` is valid.
 */
export function canTransition(current: OralStatus, next: OralStatus): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
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
 * Compute remaining time in milliseconds for the current timed phase.
 * Returns 0 if phase is expired, not timed, or not started.
 */
export function remainingTimeMs(
  status: OralStatus,
  phaseStartedAt: Date | null,
  now: Date = new Date(),
): number {
  if (!phaseStartedAt) return 0;

  const durationMs =
    status === 'PREP_RUNNING' ? PREP_DURATION_MS :
    status === 'PASSAGE_RUNNING' ? PASSAGE_DURATION_MS :
    0;
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
  if (status !== 'PREP_RUNNING' && status !== 'PASSAGE_RUNNING') return false;
  if (!phaseStartedAt) return false;
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
