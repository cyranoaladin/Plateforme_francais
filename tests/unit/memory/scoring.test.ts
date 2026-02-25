import { describe, it, expect } from 'vitest';
import {
  updateSkillScore,
  computeWeakSeverity,
  applyDecay,
  computeSkillTrend,
  computeConfidence,
  estimateGlobalLevel,
  shouldCreateWeakSkill,
} from '@/lib/memory/scoring';

describe('P0-SaaS-5: Memory Store Scoring', () => {
  describe('updateSkillScore (Weighted Moving Average)', () => {
    it('returns newScore directly on first observation', () => {
      expect(updateSkillScore(0, 0, 0.7)).toBe(0.7);
    });

    it('blends current and new score with 30% recency weight', () => {
      // 0.5 * 0.7 + 0.8 * 0.3 = 0.35 + 0.24 = 0.59
      expect(updateSkillScore(0.5, 5, 0.8)).toBe(0.59);
    });

    it('trends toward new score over multiple updates', () => {
      let score = 0.3;
      for (let i = 0; i < 10; i++) {
        score = updateSkillScore(score, i + 1, 0.9);
      }
      expect(score).toBeGreaterThan(0.7);
    });

    it('respects custom recency weight', () => {
      const result = updateSkillScore(0.5, 3, 1.0, 0.5);
      expect(result).toBe(0.75); // 0.5 * 0.5 + 1.0 * 0.5
    });
  });

  describe('computeWeakSeverity', () => {
    it('returns CRITICAL for high frequency × recency', () => {
      expect(computeWeakSeverity(5, 0.9)).toBe('CRITICAL'); // 4.5
    });

    it('returns HIGH for moderate score', () => {
      expect(computeWeakSeverity(3, 0.8)).toBe('HIGH'); // 2.4
    });

    it('returns MEDIUM for mild score', () => {
      expect(computeWeakSeverity(2, 0.7)).toBe('MEDIUM'); // 1.4
    });

    it('returns LOW for low score', () => {
      expect(computeWeakSeverity(1, 0.5)).toBe('LOW'); // 0.5
    });
  });

  describe('applyDecay', () => {
    it('decays by 0.97^days', () => {
      const { decayedScore } = applyDecay(1.0, 1);
      expect(decayedScore).toBeCloseTo(0.97, 2);
    });

    it('marks as improving when below 0.3', () => {
      const { decayedScore, shouldMarkImproving } = applyDecay(1.0, 40);
      expect(decayedScore).toBeLessThan(0.3);
      expect(shouldMarkImproving).toBe(true);
    });

    it('does not mark improving when above 0.3', () => {
      const { shouldMarkImproving } = applyDecay(1.0, 5);
      expect(shouldMarkImproving).toBe(false);
    });

    it('handles 0 days (no decay)', () => {
      const { decayedScore } = applyDecay(0.8, 0);
      expect(decayedScore).toBe(0.8);
    });
  });

  describe('computeSkillTrend', () => {
    it('returns STABLE with fewer than 4 scores', () => {
      expect(computeSkillTrend([0.5, 0.6])).toBe('STABLE');
    });

    it('returns IMPROVING when recent scores are higher', () => {
      expect(computeSkillTrend([0.3, 0.3, 0.3, 0.6, 0.7, 0.8])).toBe('IMPROVING');
    });

    it('returns DECLINING when recent scores are lower', () => {
      expect(computeSkillTrend([0.8, 0.7, 0.8, 0.4, 0.3, 0.3])).toBe('DECLINING');
    });

    it('returns STABLE when scores are flat', () => {
      expect(computeSkillTrend([0.5, 0.5, 0.5, 0.5, 0.5, 0.5])).toBe('STABLE');
    });
  });

  describe('computeConfidence', () => {
    it('returns 0 for no observations', () => {
      expect(computeConfidence(0)).toBe(0);
    });

    it('grows with more observations', () => {
      const c1 = computeConfidence(1);
      const c5 = computeConfidence(5);
      const c20 = computeConfidence(20);
      expect(c5).toBeGreaterThan(c1);
      expect(c20).toBeGreaterThan(c5);
    });

    it('caps at 1.0', () => {
      expect(computeConfidence(100)).toBe(1.0);
    });
  });

  describe('estimateGlobalLevel', () => {
    it('maps score ranges to levels', () => {
      expect(estimateGlobalLevel(0.9)).toBe('EXCELLENT');
      expect(estimateGlobalLevel(0.7)).toBe('SATISFAISANT');
      expect(estimateGlobalLevel(0.5)).toBe('PASSABLE');
      expect(estimateGlobalLevel(0.2)).toBe('INSUFFISANT');
    });
  });

  describe('shouldCreateWeakSkill', () => {
    it('triggers at 3+ occurrences', () => {
      expect(shouldCreateWeakSkill(3)).toBe(true);
      expect(shouldCreateWeakSkill(5)).toBe(true);
    });

    it('does not trigger below 3', () => {
      expect(shouldCreateWeakSkill(2)).toBe(false);
      expect(shouldCreateWeakSkill(0)).toBe(false);
    });
  });
});
