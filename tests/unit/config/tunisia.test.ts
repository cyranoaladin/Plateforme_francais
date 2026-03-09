import { describe, it, expect } from 'vitest';
import {
  getDaysUntilExam,
  getExamPhase,
  getUpcomingSimulations,
  getHardcodedDefaults,
  getNowInTunis,
} from '@/lib/config/tunisia';

describe('tunisia config', () => {
  const config = getHardcodedDefaults();

  describe('getDaysUntilExam', () => {
    it('retourne un nombre positif avant examen', () => {
      const result = getDaysUntilExam(config, new Date('2026-01-15'));
      expect(result).toBeGreaterThan(0);
    });

    it('retourne 0 le jour de l examen', () => {
      const result = getDaysUntilExam(config, new Date('2026-06-11'));
      expect(result).toBe(0);
    });

    it('retourne 0 après examen', () => {
      const result = getDaysUntilExam(config, new Date('2026-07-01'));
      expect(result).toBe(0);
    });
  });

  describe('getExamPhase', () => {
    it('retourne fondations si > 21 jours', () => {
      expect(getExamPhase(30).phase).toBe('fondations');
    });

    it('retourne simulation_1 si 8-21 jours', () => {
      expect(getExamPhase(15).phase).toBe('simulation_1');
    });

    it('retourne simulation_2 si 1-7 jours', () => {
      expect(getExamPhase(5).phase).toBe('simulation_2');
    });

    it('retourne jour_j si 0 jours', () => {
      expect(getExamPhase(0).phase).toBe('jour_j');
    });

    it('chaque phase a un label et une action', () => {
      for (const days of [30, 15, 5, 0]) {
        const phase = getExamPhase(days);
        expect(phase.label).toBeTruthy();
        expect(phase.action).toBeTruthy();
      }
    });
  });

  describe('getUpcomingSimulations', () => {
    it('retourne 2 simulations obligatoires', () => {
      const sims = getUpcomingSimulations(config, new Date('2026-01-15'));
      expect(sims).toHaveLength(2);
    });

    it('calcule daysUntil correctement', () => {
      const sims = getUpcomingSimulations(config, new Date('2026-05-18'));
      const j21 = sims.find(s => s.id === 'sim_j21');
      expect(j21?.daysUntil).toBe(0);
    });

    it('marque overdue quand date passée', () => {
      const sims = getUpcomingSimulations(config, new Date('2026-06-05'));
      const j21 = sims.find(s => s.id === 'sim_j21');
      expect(j21?.overdue).toBe(true);
    });
  });

  describe('getNowInTunis', () => {
    it('retourne dateStr et timeStr', () => {
      const result = getNowInTunis(new Date('2026-03-08T12:00:00Z'));
      expect(result.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.timeStr).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});
