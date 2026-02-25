import { describe, it, expect } from 'vitest';
import {
  computeSummary,
  oralSessionsToCsv,
  ecritCopiesToCsv,
  portfolioToJson,
  type OralSessionExport,
  type EcritCopieExport,
  type BadgeExport,
  type PortfolioData,
} from '@/lib/portfolio/export';

const mockOral: OralSessionExport[] = [
  { id: '1', oeuvre: 'Les Fleurs du Mal', date: '2025-06-01', mode: 'SIMULATION', status: 'FINALIZED', totalScore: 14, phases: [] },
  { id: '2', oeuvre: 'Le Malade imaginaire', date: '2025-06-10', mode: 'FREE_PRACTICE', status: 'FINALIZED', totalScore: 16, phases: [] },
  { id: '3', oeuvre: 'Les Misérables', date: '2025-06-12', mode: 'SIMULATION', status: 'ABANDONED', totalScore: null, phases: [] },
];

const mockEcrit: EcritCopieExport[] = [
  { id: 'e1', type: 'dissertation', date: '2025-05-20', score: 12, mention: 'Assez Bien', feedback: 'Bon travail' },
  { id: 'e2', type: 'commentaire', date: '2025-06-05', score: 15, mention: 'Bien', feedback: null },
];

const mockBadges: BadgeExport[] = [
  { name: 'Premier oral', description: 'Première simulation complétée', earnedAt: '2025-06-01' },
  { name: 'Streak 7j', description: '7 jours consécutifs', earnedAt: '2025-06-08' },
];

describe('Portfolio Export', () => {
  describe('computeSummary', () => {
    it('computes averages excluding null scores', () => {
      const summary = computeSummary(mockOral, mockEcrit, mockBadges);
      expect(summary.totalOralSessions).toBe(3);
      expect(summary.avgOralScore).toBe(15); // (14+16)/2
      expect(summary.totalEcritCopies).toBe(2);
      expect(summary.avgEcritScore).toBe(13.5); // (12+15)/2
      expect(summary.badgeCount).toBe(2);
      expect(summary.bestOralScore).toBe(16);
      expect(summary.bestEcritScore).toBe(15);
    });

    it('returns null averages for empty arrays', () => {
      const summary = computeSummary([], [], []);
      expect(summary.totalOralSessions).toBe(0);
      expect(summary.avgOralScore).toBeNull();
      expect(summary.avgEcritScore).toBeNull();
      expect(summary.bestOralScore).toBeNull();
      expect(summary.bestEcritScore).toBeNull();
    });
  });

  describe('oralSessionsToCsv', () => {
    it('generates valid CSV with header', () => {
      const csv = oralSessionsToCsv(mockOral);
      const lines = csv.split('\n');
      expect(lines[0]).toBe('id,oeuvre,date,mode,status,totalScore');
      expect(lines).toHaveLength(4); // header + 3 rows
      expect(lines[1]).toContain('Les Fleurs du Mal');
      expect(lines[3]).toContain('ABANDONED');
    });

    it('returns header only for empty array', () => {
      const csv = oralSessionsToCsv([]);
      expect(csv).toBe('id,oeuvre,date,mode,status,totalScore');
    });
  });

  describe('ecritCopiesToCsv', () => {
    it('generates valid CSV', () => {
      const csv = ecritCopiesToCsv(mockEcrit);
      const lines = csv.split('\n');
      expect(lines[0]).toBe('id,type,date,score,mention');
      expect(lines).toHaveLength(3);
    });
  });

  describe('portfolioToJson', () => {
    it('generates valid JSON string', () => {
      const data: PortfolioData = {
        student: { displayName: 'Jean', anneeScolaire: '2025-2026', exportDate: '2025-06-15' },
        oralSessions: mockOral,
        ecritCopies: mockEcrit,
        badges: mockBadges,
        summary: computeSummary(mockOral, mockEcrit, mockBadges),
      };
      const json = portfolioToJson(data);
      const parsed = JSON.parse(json);
      expect(parsed.student.displayName).toBe('Jean');
      expect(parsed.oralSessions).toHaveLength(3);
      expect(parsed.summary.badgeCount).toBe(2);
    });
  });
});
