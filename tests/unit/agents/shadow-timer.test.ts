import { describe, it, expect } from 'vitest';
import {
  evaluateNudgeRules,
  detectsProcedes,
  detectsGrammaire,
  PREP_TOTAL_MS,
  NUDGE_COOLDOWN_MS,
  type PrepHeartbeat,
} from '@/lib/agents/shadow-timer/shadow-timer';

describe('P0-SaaS-3: Shadow Timer Cognitif', () => {
  const NOW = Date.now();

  function makeHeartbeat(overrides: Partial<PrepHeartbeat> = {}): PrepHeartbeat {
    return {
      sessionId: 'sess-1',
      notesLength: 50,
      hasProcedes: false,
      hasGrammaire: false,
      timeElapsedMs: 10 * 60_000,
      ...overrides,
    };
  }

  describe('evaluateNudgeRules', () => {
    it('returns null during cooldown', () => {
      const hb = makeHeartbeat({ timeElapsedMs: 25 * 60_000 });
      const result = evaluateNudgeRules(hb, NOW - 2 * 60_000, NOW);
      expect(result).toBeNull();
    });

    it('fires prep_end when time is up', () => {
      const hb = makeHeartbeat({ timeElapsedMs: PREP_TOTAL_MS + 1000 });
      const result = evaluateNudgeRules(hb, null, NOW);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('prep_end');
      expect(result!.priority).toBe('high');
    });

    it('fires blocage for very short notes after 3+ min with < 20 min remaining', () => {
      const hb = makeHeartbeat({
        notesLength: 5,
        timeElapsedMs: 12 * 60_000, // 12 min elapsed → 18 min remaining
      });
      const result = evaluateNudgeRules(hb, null, NOW);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('blocage');
    });

    it('fires grammaire_missing at 10 min remaining', () => {
      const hb = makeHeartbeat({
        hasGrammaire: false,
        notesLength: 500,
        timeElapsedMs: 22 * 60_000, // 8 min remaining
      });
      const result = evaluateNudgeRules(hb, null, NOW);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('grammaire_missing');
    });

    it('fires procedes_missing at 5 min remaining', () => {
      const hb = makeHeartbeat({
        hasProcedes: false,
        hasGrammaire: true,
        notesLength: 500,
        timeElapsedMs: 27 * 60_000, // 3 min remaining
      });
      const result = evaluateNudgeRules(hb, null, NOW);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('procedes_missing');
    });

    it('returns null when everything is fine', () => {
      const hb = makeHeartbeat({
        notesLength: 500,
        hasProcedes: true,
        hasGrammaire: true,
        timeElapsedMs: 5 * 60_000, // 25 min remaining
      });
      const result = evaluateNudgeRules(hb, null, NOW);
      expect(result).toBeNull();
    });

    it('respects 5-minute cooldown', () => {
      expect(NUDGE_COOLDOWN_MS).toBe(5 * 60 * 1000);
    });
  });

  describe('detectsProcedes', () => {
    it('detects literary device keywords', () => {
      expect(detectsProcedes('La métaphore filée du voyage')).toBe(true);
      expect(detectsProcedes('L\'anaphore souligne la répétition')).toBe(true);
    });

    it('returns false for plain text', () => {
      expect(detectsProcedes('Je vais parler du texte')).toBe(false);
    });
  });

  describe('detectsGrammaire', () => {
    it('detects grammar keywords', () => {
      expect(detectsGrammaire('Le subjonctif présent exprime le doute')).toBe(true);
      expect(detectsGrammaire('La proposition subordonnée relative')).toBe(true);
    });

    it('returns false for non-grammar text', () => {
      expect(detectsGrammaire('Baudelaire explore le spleen')).toBe(false);
    });
  });
});
