import { describe, it, expect } from 'vitest';
import { createCard, reviewCard, getDueCards, oralScoreToQuality } from '@/lib/spaced-repetition/sm2';

describe('SM-2 Spaced Repetition Engine', () => {
  const NOW = new Date('2025-06-15T10:00:00Z');

  describe('createCard', () => {
    it('creates a card with default values', () => {
      const card = createCard(NOW);
      expect(card.repetition).toBe(0);
      expect(card.interval).toBe(0);
      expect(card.easeFactor).toBe(2.5);
      expect(card.nextReviewDate).toBe(NOW.toISOString());
    });
  });

  describe('reviewCard', () => {
    it('sets interval to 1 day on first successful review', () => {
      const card = createCard(NOW);
      const result = reviewCard(card, 4, NOW);
      expect(result.success).toBe(true);
      expect(result.repetition).toBe(1);
      expect(result.interval).toBe(1);
      expect(new Date(result.nextReviewDate).toISOString()).toBe('2025-06-16T10:00:00.000Z');
    });

    it('sets interval to 6 days on second successful review', () => {
      const card = { repetition: 1, interval: 1, easeFactor: 2.5, nextReviewDate: NOW.toISOString() };
      const result = reviewCard(card, 4, NOW);
      expect(result.repetition).toBe(2);
      expect(result.interval).toBe(6);
    });

    it('multiplies interval by ease factor on subsequent reviews', () => {
      const card = { repetition: 2, interval: 6, easeFactor: 2.5, nextReviewDate: NOW.toISOString() };
      const result = reviewCard(card, 4, NOW);
      expect(result.repetition).toBe(3);
      expect(result.interval).toBe(15); // 6 * 2.5 = 15
    });

    it('resets on failed review (quality < 3)', () => {
      const card = { repetition: 5, interval: 30, easeFactor: 2.5, nextReviewDate: NOW.toISOString() };
      const result = reviewCard(card, 2, NOW);
      expect(result.success).toBe(false);
      expect(result.repetition).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('decreases ease factor on low quality', () => {
      const card = createCard(NOW);
      const result = reviewCard(card, 3, NOW);
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('increases ease factor on high quality', () => {
      const card = createCard(NOW);
      const result = reviewCard(card, 5, NOW);
      expect(result.easeFactor).toBeGreaterThanOrEqual(2.5);
    });

    it('never goes below minimum ease factor 1.3', () => {
      let card = createCard(NOW);
      // Repeatedly fail
      for (let i = 0; i < 20; i++) {
        const result = reviewCard(card, 0, NOW);
        card = result;
      }
      expect(card.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('clamps quality to 0-5 range', () => {
      const card = createCard(NOW);
      const r1 = reviewCard(card, -5, NOW);
      expect(r1.success).toBe(false);
      const r2 = reviewCard(card, 10, NOW);
      expect(r2.success).toBe(true);
    });
  });

  describe('getDueCards', () => {
    it('returns cards due on or before now', () => {
      const past = { ...createCard(), nextReviewDate: '2025-06-14T10:00:00.000Z' };
      const today = { ...createCard(), nextReviewDate: '2025-06-15T10:00:00.000Z' };
      const future = { ...createCard(), nextReviewDate: '2025-06-16T10:00:00.000Z' };
      const due = getDueCards([past, today, future], NOW);
      expect(due).toHaveLength(2);
      expect(due).toContain(past);
      expect(due).toContain(today);
    });

    it('returns empty for no due cards', () => {
      const future = { ...createCard(), nextReviewDate: '2025-12-01T00:00:00.000Z' };
      expect(getDueCards([future], NOW)).toHaveLength(0);
    });
  });

  describe('oralScoreToQuality', () => {
    it('maps perfect score to quality 5', () => {
      expect(oralScoreToQuality(8, 8)).toBe(5);
    });

    it('maps 75% to quality 4', () => {
      expect(oralScoreToQuality(6, 8)).toBe(4);
    });

    it('maps 50% to quality 3', () => {
      expect(oralScoreToQuality(4, 8)).toBe(3);
    });

    it('maps 30% to quality 2', () => {
      expect(oralScoreToQuality(2.5, 8)).toBe(2);
    });

    it('maps low score to quality 1', () => {
      expect(oralScoreToQuality(1, 8)).toBe(1);
    });

    it('maps zero to quality 0', () => {
      expect(oralScoreToQuality(0, 8)).toBe(0);
    });

    it('handles zero maxScore gracefully', () => {
      expect(oralScoreToQuality(5, 0)).toBe(0);
    });
  });
});
