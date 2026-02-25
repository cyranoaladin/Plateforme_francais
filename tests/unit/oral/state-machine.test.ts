import { describe, it, expect } from 'vitest';
import {
  canTransition,
  transition,
  remainingTimeMs,
  isPhaseExpired,
  OralTransitionError,
  PREP_DURATION_MS,
  PASSAGE_DURATION_MS,
  TERMINAL_STATES,
} from '@/lib/oral/state-machine';

describe('Oral State Machine V2 — 7 states', () => {
  describe('canTransition', () => {
    it('DRAFT → PREP_RUNNING is valid', () => {
      expect(canTransition('DRAFT', 'PREP_RUNNING')).toBe(true);
    });

    it('PREP_RUNNING → PREP_ENDED is valid', () => {
      expect(canTransition('PREP_RUNNING', 'PREP_ENDED')).toBe(true);
    });

    it('PREP_ENDED → PASSAGE_RUNNING is valid', () => {
      expect(canTransition('PREP_ENDED', 'PASSAGE_RUNNING')).toBe(true);
    });

    it('PASSAGE_RUNNING → PASSAGE_DONE is valid', () => {
      expect(canTransition('PASSAGE_RUNNING', 'PASSAGE_DONE')).toBe(true);
    });

    it('PASSAGE_DONE → FINALIZED is valid', () => {
      expect(canTransition('PASSAGE_DONE', 'FINALIZED')).toBe(true);
    });

    it('any non-terminal → ABANDONED is valid', () => {
      expect(canTransition('DRAFT', 'ABANDONED')).toBe(true);
      expect(canTransition('PREP_RUNNING', 'ABANDONED')).toBe(true);
      expect(canTransition('PREP_ENDED', 'ABANDONED')).toBe(true);
      expect(canTransition('PASSAGE_RUNNING', 'ABANDONED')).toBe(true);
      expect(canTransition('PASSAGE_DONE', 'ABANDONED')).toBe(true);
    });

    it('terminal states cannot transition', () => {
      expect(canTransition('FINALIZED', 'DRAFT')).toBe(false);
      expect(canTransition('FINALIZED', 'ABANDONED')).toBe(false);
      expect(canTransition('ABANDONED', 'DRAFT')).toBe(false);
      expect(canTransition('ABANDONED', 'FINALIZED')).toBe(false);
    });

    it('backward transitions are invalid in SIMULATION', () => {
      expect(canTransition('PREP_ENDED', 'PREP_RUNNING')).toBe(false);
      expect(canTransition('PASSAGE_RUNNING', 'PREP_ENDED')).toBe(false);
      expect(canTransition('PASSAGE_DONE', 'PASSAGE_RUNNING')).toBe(false);
    });

    it('skipping states is invalid', () => {
      expect(canTransition('DRAFT', 'PASSAGE_RUNNING')).toBe(false);
      expect(canTransition('DRAFT', 'FINALIZED')).toBe(false);
      expect(canTransition('PREP_RUNNING', 'PASSAGE_RUNNING')).toBe(false);
      expect(canTransition('PREP_RUNNING', 'FINALIZED')).toBe(false);
    });
  });

  describe('transition', () => {
    it('returns next status on valid happy-path transition', () => {
      expect(transition('DRAFT', 'PREP_RUNNING')).toBe('PREP_RUNNING');
      expect(transition('PREP_RUNNING', 'PREP_ENDED')).toBe('PREP_ENDED');
      expect(transition('PREP_ENDED', 'PASSAGE_RUNNING')).toBe('PASSAGE_RUNNING');
      expect(transition('PASSAGE_RUNNING', 'PASSAGE_DONE')).toBe('PASSAGE_DONE');
      expect(transition('PASSAGE_DONE', 'FINALIZED')).toBe('FINALIZED');
    });

    it('allows abandon from any non-terminal state', () => {
      expect(transition('DRAFT', 'ABANDONED')).toBe('ABANDONED');
      expect(transition('PREP_RUNNING', 'ABANDONED')).toBe('ABANDONED');
      expect(transition('PASSAGE_RUNNING', 'ABANDONED')).toBe('ABANDONED');
    });

    it('throws OralTransitionError on invalid transition', () => {
      expect(() => transition('FINALIZED', 'DRAFT')).toThrow(OralTransitionError);
      expect(() => transition('DRAFT', 'FINALIZED')).toThrow(OralTransitionError);
    });

    it('error contains from/to info', () => {
      try {
        transition('PASSAGE_RUNNING', 'DRAFT');
      } catch (e) {
        expect(e).toBeInstanceOf(OralTransitionError);
        expect((e as OralTransitionError).from).toBe('PASSAGE_RUNNING');
        expect((e as OralTransitionError).to).toBe('DRAFT');
      }
    });
  });

  describe('TERMINAL_STATES', () => {
    it('contains FINALIZED and ABANDONED', () => {
      expect(TERMINAL_STATES.has('FINALIZED')).toBe(true);
      expect(TERMINAL_STATES.has('ABANDONED')).toBe(true);
    });

    it('does not contain non-terminal states', () => {
      expect(TERMINAL_STATES.has('DRAFT')).toBe(false);
      expect(TERMINAL_STATES.has('PREP_RUNNING')).toBe(false);
      expect(TERMINAL_STATES.has('PASSAGE_RUNNING')).toBe(false);
    });
  });

  describe('remainingTimeMs', () => {
    it('returns full duration when phase just started', () => {
      const now = new Date();
      expect(remainingTimeMs('PREP_RUNNING', now, now)).toBe(PREP_DURATION_MS);
      expect(remainingTimeMs('PASSAGE_RUNNING', now, now)).toBe(PASSAGE_DURATION_MS);
    });

    it('returns reduced time after elapsed time', () => {
      const start = new Date('2025-01-01T10:00:00Z');
      const now = new Date('2025-01-01T10:10:00Z');
      const expected = PREP_DURATION_MS - 10 * 60 * 1000;
      expect(remainingTimeMs('PREP_RUNNING', start, now)).toBe(expected);
    });

    it('returns 0 when phase has expired', () => {
      const start = new Date('2025-01-01T10:00:00Z');
      const now = new Date('2025-01-01T11:00:00Z');
      expect(remainingTimeMs('PREP_RUNNING', start, now)).toBe(0);
      expect(remainingTimeMs('PASSAGE_RUNNING', start, now)).toBe(0);
    });

    it('returns 0 for non-timed states', () => {
      const now = new Date();
      expect(remainingTimeMs('DRAFT', now, now)).toBe(0);
      expect(remainingTimeMs('FINALIZED', now, now)).toBe(0);
      expect(remainingTimeMs('PREP_ENDED', now, now)).toBe(0);
      expect(remainingTimeMs('PASSAGE_DONE', now, now)).toBe(0);
      expect(remainingTimeMs('ABANDONED', now, now)).toBe(0);
    });

    it('returns 0 when phaseStartedAt is null', () => {
      expect(remainingTimeMs('PREP_RUNNING', null)).toBe(0);
    });
  });

  describe('isPhaseExpired', () => {
    it('returns false for non-timed states', () => {
      expect(isPhaseExpired('DRAFT', new Date())).toBe(false);
      expect(isPhaseExpired('FINALIZED', new Date())).toBe(false);
      expect(isPhaseExpired('ABANDONED', new Date())).toBe(false);
      expect(isPhaseExpired('PREP_ENDED', new Date())).toBe(false);
      expect(isPhaseExpired('PASSAGE_DONE', new Date())).toBe(false);
    });

    it('returns false when phase still has time', () => {
      const now = new Date();
      expect(isPhaseExpired('PREP_RUNNING', now, now)).toBe(false);
    });

    it('returns true when phase has expired', () => {
      const start = new Date('2025-01-01T10:00:00Z');
      const now = new Date('2025-01-01T11:00:00Z');
      expect(isPhaseExpired('PREP_RUNNING', start, now)).toBe(true);
      expect(isPhaseExpired('PASSAGE_RUNNING', start, now)).toBe(true);
    });

    it('returns false when phaseStartedAt is null', () => {
      expect(isPhaseExpired('PREP_RUNNING', null)).toBe(false);
    });
  });

  describe('timer durations', () => {
    it('PREP is 30 minutes', () => {
      expect(PREP_DURATION_MS).toBe(30 * 60 * 1000);
    });

    it('PASSAGE is 20 minutes', () => {
      expect(PASSAGE_DURATION_MS).toBe(20 * 60 * 1000);
    });
  });
});
