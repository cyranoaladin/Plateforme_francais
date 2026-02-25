import { describe, it, expect } from 'vitest';
import {
  canTransition,
  transition,
  remainingTimeMs,
  isPhaseExpired,
  OralTransitionError,
  PREP_DURATION_MS,
  PASSAGE_DURATION_MS,
} from '@/lib/oral/state-machine';

describe('canTransition', () => {
  it('DRAFT → PREP is valid', () => {
    expect(canTransition('DRAFT', 'PREP')).toBe(true);
  });

  it('PREP → PASSAGE is valid', () => {
    expect(canTransition('PREP', 'PASSAGE')).toBe(true);
  });

  it('PASSAGE → DONE is valid', () => {
    expect(canTransition('PASSAGE', 'DONE')).toBe(true);
  });

  it('DRAFT → PASSAGE is invalid (skip)', () => {
    expect(canTransition('DRAFT', 'PASSAGE')).toBe(false);
  });

  it('DRAFT → DONE is invalid (skip)', () => {
    expect(canTransition('DRAFT', 'DONE')).toBe(false);
  });

  it('DONE → anything is invalid', () => {
    expect(canTransition('DONE', 'DRAFT')).toBe(false);
    expect(canTransition('DONE', 'PREP')).toBe(false);
    expect(canTransition('DONE', 'PASSAGE')).toBe(false);
    expect(canTransition('DONE', 'DONE')).toBe(false);
  });

  it('backward transitions are invalid', () => {
    expect(canTransition('PREP', 'DRAFT')).toBe(false);
    expect(canTransition('PASSAGE', 'PREP')).toBe(false);
    expect(canTransition('PASSAGE', 'DRAFT')).toBe(false);
  });
});

describe('transition', () => {
  it('returns the next status on valid transition', () => {
    expect(transition('DRAFT', 'PREP')).toBe('PREP');
    expect(transition('PREP', 'PASSAGE')).toBe('PASSAGE');
    expect(transition('PASSAGE', 'DONE')).toBe('DONE');
  });

  it('throws OralTransitionError on invalid transition', () => {
    expect(() => transition('DRAFT', 'DONE')).toThrow(OralTransitionError);
    expect(() => transition('DONE', 'PREP')).toThrow(OralTransitionError);
  });

  it('error contains from/to fields', () => {
    try {
      transition('DRAFT', 'DONE');
    } catch (error) {
      expect(error).toBeInstanceOf(OralTransitionError);
      expect((error as OralTransitionError).from).toBe('DRAFT');
      expect((error as OralTransitionError).to).toBe('DONE');
    }
  });
});

describe('remainingTimeMs', () => {
  it('returns full PREP duration when just started', () => {
    const now = new Date();
    expect(remainingTimeMs('PREP', now, now)).toBe(PREP_DURATION_MS);
  });

  it('returns reduced time after 10 minutes of prep', () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const now = new Date('2026-01-01T10:10:00Z');
    expect(remainingTimeMs('PREP', start, now)).toBe(PREP_DURATION_MS - 10 * 60 * 1000);
  });

  it('returns 0 when PREP time is fully elapsed', () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const now = new Date('2026-01-01T10:31:00Z');
    expect(remainingTimeMs('PREP', start, now)).toBe(0);
  });

  it('returns full PASSAGE duration when just started', () => {
    const now = new Date();
    expect(remainingTimeMs('PASSAGE', now, now)).toBe(PASSAGE_DURATION_MS);
  });

  it('returns 0 for DRAFT status', () => {
    expect(remainingTimeMs('DRAFT', new Date(), new Date())).toBe(0);
  });

  it('returns 0 for DONE status', () => {
    expect(remainingTimeMs('DONE', new Date(), new Date())).toBe(0);
  });

  it('returns 0 when phaseStartedAt is null', () => {
    expect(remainingTimeMs('PREP', null)).toBe(0);
  });
});

describe('isPhaseExpired', () => {
  it('returns false for DRAFT/DONE', () => {
    expect(isPhaseExpired('DRAFT', new Date())).toBe(false);
    expect(isPhaseExpired('DONE', new Date())).toBe(false);
  });

  it('returns false when PREP has time left', () => {
    const now = new Date();
    expect(isPhaseExpired('PREP', now, now)).toBe(false);
  });

  it('returns true when PREP is expired', () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const now = new Date('2026-01-01T10:31:00Z');
    expect(isPhaseExpired('PREP', start, now)).toBe(true);
  });

  it('returns true when PASSAGE is expired', () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const now = new Date('2026-01-01T10:21:00Z');
    expect(isPhaseExpired('PASSAGE', start, now)).toBe(true);
  });
});

describe('timer constants', () => {
  it('PREP is 30 minutes', () => {
    expect(PREP_DURATION_MS).toBe(30 * 60 * 1000);
  });

  it('PASSAGE is 20 minutes', () => {
    expect(PASSAGE_DURATION_MS).toBe(20 * 60 * 1000);
  });
});
