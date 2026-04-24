import { describe, it, expect } from 'vitest';
import {
  canTransition,
  transition,
  remainingTimeMs,
  PREP_DURATION_MS,
  PASSAGE_DURATION_MS,
} from '@/lib/oral/state-machine';

describe('oral/state-machine', () => {
  it('refuse les transitions invalides', () => {
    expect(canTransition('DRAFT', 'PASSAGE_RUNNING')).toBe(false);
    expect(() => transition('DRAFT', 'PASSAGE_RUNNING')).toThrow();
  });

  it('calcule le temps restant en PREP (30min) et PASSAGE (20min)', () => {
    const now = new Date('2026-03-05T10:00:00Z');
    const started = new Date(now.getTime() - 5 * 60_000); // -5 min

    const prepRemaining = remainingTimeMs('PREP_RUNNING', started, now);
    expect(prepRemaining).toBe(PREP_DURATION_MS - 5 * 60_000);

    const passRemaining = remainingTimeMs('PASSAGE_RUNNING', started, now);
    expect(passRemaining).toBe(PASSAGE_DURATION_MS - 5 * 60_000);
  });
});
