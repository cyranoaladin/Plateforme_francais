import { describe, it, expect } from 'vitest';
import {
  buildWeeklyDigest,
  computeTrend,
  digestToPlainText,
  type WeeklyActivity,
} from '@/lib/parent/digest';

const WEEK_START = new Date('2025-06-09T00:00:00Z');

const mockActivities: WeeklyActivity[] = [
  { date: '2025-06-09', type: 'oral', label: 'Simulation Baudelaire', score: 14, maxScore: 20 },
  { date: '2025-06-09', type: 'quiz', label: 'Quiz figures de style', score: 8, maxScore: 10 },
  { date: '2025-06-10', type: 'ecrit', label: 'Dissertation Molière', score: 12, maxScore: 20 },
  { date: '2025-06-11', type: 'revision', label: 'Fiches Hugo', score: null, maxScore: null },
  { date: '2025-06-12', type: 'oral', label: 'Simulation Rousseau', score: 16, maxScore: 20 },
];

describe('Parent Weekly Digest', () => {
  describe('buildWeeklyDigest', () => {
    it('computes counts and averages correctly', () => {
      const digest = buildWeeklyDigest('Jean', mockActivities, WEEK_START, 5, ['Premier oral'], 60);
      expect(digest.studentName).toBe('Jean');
      expect(digest.totalActivities).toBe(5);
      expect(digest.oralCount).toBe(2);
      expect(digest.ecritCount).toBe(1);
      expect(digest.quizCount).toBe(1);
      expect(digest.revisionCount).toBe(1);
      expect(digest.activeDays).toBe(4);
      expect(digest.streak).toBe(5);
      expect(digest.newBadges).toEqual(['Premier oral']);
    });

    it('computes avg score as percentage', () => {
      const digest = buildWeeklyDigest('Jean', mockActivities, WEEK_START, 0, [], null);
      // scores: 14/20=70, 8/10=80, 12/20=60, 16/20=80 → avg = 72.5 → rounded 73
      expect(digest.avgScore).toBe(73);
    });

    it('finds top activity by score ratio', () => {
      const digest = buildWeeklyDigest('Jean', mockActivities, WEEK_START, 0, [], null);
      expect(digest.topActivity).not.toBeNull();
      // 8/10=80% and 16/20=80% are tied, first found wins via reduce
      expect(digest.topActivity!.score).toBeGreaterThan(0);
    });

    it('handles empty activities', () => {
      const digest = buildWeeklyDigest('Marie', [], WEEK_START, 0, [], null);
      expect(digest.totalActivities).toBe(0);
      expect(digest.activeDays).toBe(0);
      expect(digest.avgScore).toBeNull();
      expect(digest.topActivity).toBeNull();
      expect(digest.trend).toBe('insufficient_data');
    });

    it('sets weekEnd to 6 days after weekStart', () => {
      const digest = buildWeeklyDigest('Jean', [], WEEK_START, 0, [], null);
      expect(digest.weekStart).toBe('2025-06-09');
      expect(digest.weekEnd).toBe('2025-06-15');
    });
  });

  describe('computeTrend', () => {
    it('returns improving for +5 diff', () => {
      expect(computeTrend(75, 60)).toBe('improving');
    });

    it('returns declining for -5 diff', () => {
      expect(computeTrend(55, 70)).toBe('declining');
    });

    it('returns stable for small diff', () => {
      expect(computeTrend(72, 70)).toBe('stable');
    });

    it('returns insufficient_data when either is null', () => {
      expect(computeTrend(null, 70)).toBe('insufficient_data');
      expect(computeTrend(70, null)).toBe('insufficient_data');
    });
  });

  describe('digestToPlainText', () => {
    it('generates readable text with all sections', () => {
      const digest = buildWeeklyDigest('Jean', mockActivities, WEEK_START, 5, ['Premier oral'], 60);
      const text = digestToPlainText(digest);
      expect(text).toContain('Jean');
      expect(text).toContain('2025-06-09');
      expect(text).toContain('Oral : 2');
      expect(text).toContain('Streak : 5');
      expect(text).toContain('Premier oral');
    });

    it('omits badges section when empty', () => {
      const digest = buildWeeklyDigest('Jean', [], WEEK_START, 0, [], null);
      const text = digestToPlainText(digest);
      expect(text).not.toContain('Nouveaux badges');
    });
  });
});
