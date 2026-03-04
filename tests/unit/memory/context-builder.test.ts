import { describe, it, expect } from 'vitest';
import {
  mapAgentToSummaryType,
  composeMemoryContext,
  filterWeakSkillsByAgent,
  estimateTokens,
  truncateToTokenBudget,
  MAX_MEMORY_TOKENS,
  type MemoryProfile,
  type WeakSkillSummary,
} from '@/lib/memory/context-builder';

const mockWeakSkills: WeakSkillSummary[] = [
  { skill: 'ORAL_LECTURE_FLUIDITE', pattern: 'Débit trop rapide en poésie', severity: 'HIGH', frequency: 4, lastOccurrenceDaysAgo: 3 },
  { skill: 'ORAL_ENTRETIEN_REACTIVITE', pattern: 'Hésitations longues en entretien', severity: 'CRITICAL', frequency: 5, lastOccurrenceDaysAgo: 1 },
  { skill: 'TRANS_LANGUE_GRAMMAIRE', pattern: 'Erreurs de subjonctif', severity: 'MEDIUM', frequency: 3, lastOccurrenceDaysAgo: 10 },
  { skill: 'ORAL_EXPLIC_CITATIONS', pattern: 'Citations approximatives', severity: 'HIGH', frequency: 3, lastOccurrenceDaysAgo: 7 },
];

const mockProfile: MemoryProfile = {
  globalLevel: 'PASSABLE',
  avgOralScore: 10.5,
  avgEcritScore: 12,
  totalSessions: 8,
  weakSkills: mockWeakSkills,
  currentWorkMastery: {
    workTitle: 'Les Fleurs du Mal',
    masteryLevel: 0.65,
    strongThemes: ['spleen', 'idéal'],
    weakThemes: ['ponctuation expressive', 'intertexte'],
    lastSessionDaysAgo: 12,
  },
  recentSessionsSummary: 'Score oral moyen : 11/20 sur les 3 dernières sessions',
};

describe('P0-SaaS-5: Memory Context Builder', () => {
  describe('mapAgentToSummaryType', () => {
    it('maps oral agents to ORAL', () => {
      expect(mapAgentToSummaryType('COACH_LECTURE')).toBe('ORAL');
      expect(mapAgentToSummaryType('ENTRETIEN_OEUVRE')).toBe('ORAL');
      expect(mapAgentToSummaryType('EXAMINATEUR_VIRTUEL')).toBe('ORAL');
    });

    it('maps SHADOW_PREP to RECENT_SESSIONS', () => {
      expect(mapAgentToSummaryType('SHADOW_PREP')).toBe('RECENT_SESSIONS');
    });

    it('maps BILAN_ORAL and QUIZ_ADAPTATIF to FULL', () => {
      expect(mapAgentToSummaryType('BILAN_ORAL')).toBe('FULL');
      expect(mapAgentToSummaryType('QUIZ_ADAPTATIF')).toBe('FULL');
    });

    it('maps écrit agents to ECRIT', () => {
      expect(mapAgentToSummaryType('DIAGNOSTIC_ECRIT')).toBe('ECRIT');
      expect(mapAgentToSummaryType('PASTICHE')).toBe('ECRIT');
    });
  });

  describe('filterWeakSkillsByAgent', () => {
    it('returns empty for TIRAGE_ORAL (no injection per ADDENDUM)', () => {
      expect(filterWeakSkillsByAgent(mockWeakSkills, 'TIRAGE_ORAL')).toHaveLength(0);
    });

    it('returns empty for SHADOW_PREP (no injection)', () => {
      expect(filterWeakSkillsByAgent(mockWeakSkills, 'SHADOW_PREP')).toHaveLength(0);
    });

    it('filters COACH_LECTURE to ORAL_LECTURE_* only', () => {
      const result = filterWeakSkillsByAgent(mockWeakSkills, 'COACH_LECTURE');
      expect(result).toHaveLength(1);
      expect(result[0].skill).toBe('ORAL_LECTURE_FLUIDITE');
    });

    it('filters ENTRETIEN_OEUVRE to ORAL_ENTRETIEN_* only', () => {
      const result = filterWeakSkillsByAgent(mockWeakSkills, 'ENTRETIEN_OEUVRE');
      expect(result).toHaveLength(1);
      expect(result[0].skill).toBe('ORAL_ENTRETIEN_REACTIVITE');
    });

    it('filters DIAGNOSTIC_ECRIT to TRANS_LANGUE_*', () => {
      const result = filterWeakSkillsByAgent(mockWeakSkills, 'DIAGNOSTIC_ECRIT');
      expect(result).toHaveLength(1);
      expect(result[0].skill).toBe('TRANS_LANGUE_GRAMMAIRE');
    });

    it('returns ALL for BILAN_ORAL', () => {
      const result = filterWeakSkillsByAgent(mockWeakSkills, 'BILAN_ORAL');
      expect(result).toHaveLength(4);
    });

    it('returns ALL for QUIZ_ADAPTATIF', () => {
      const result = filterWeakSkillsByAgent(mockWeakSkills, 'QUIZ_ADAPTATIF');
      expect(result).toHaveLength(4);
    });
  });

  describe('composeMemoryContext', () => {
    it('generates a context string with profile data', () => {
      const ctx = composeMemoryContext(mockProfile, { agentType: 'BILAN_ORAL' });
      expect(ctx).toContain('PROFIL ÉLÈVE');
      expect(ctx).toContain('PASSABLE');
      expect(ctx).toContain('10.5/20');
      expect(ctx).toContain('Les Fleurs du Mal');
      expect(ctx).toContain('65%');
      expect(ctx).toContain('Agis naturellement');
    });

    it('includes weak skills relevant to the agent', () => {
      const ctx = composeMemoryContext(mockProfile, { agentType: 'COACH_LECTURE' });
      expect(ctx).toContain('Débit trop rapide');
      expect(ctx).not.toContain('Hésitations longues en entretien');
    });

    it('omits weak skills section when none match', () => {
      const ctx = composeMemoryContext(mockProfile, { agentType: 'TIRAGE_ORAL' });
      expect(ctx).not.toContain('Lacunes actives');
    });

    it('includes work mastery details', () => {
      const ctx = composeMemoryContext(mockProfile, { agentType: 'ENTRETIEN_OEUVRE' });
      expect(ctx).toContain('Les Fleurs du Mal');
      expect(ctx).toContain('ponctuation expressive');
    });
  });

  describe('estimateTokens', () => {
    it('estimates ~4 chars per token', () => {
      expect(estimateTokens('abcd')).toBe(1);
      expect(estimateTokens('abcdefgh')).toBe(2);
    });
  });

  describe('truncateToTokenBudget', () => {
    it('returns text unchanged if within budget', () => {
      const short = 'short text';
      expect(truncateToTokenBudget(short)).toBe(short);
    });

    it('truncates long text at a newline boundary', () => {
      const longText = Array(500).fill('This is a line of text.\n').join('');
      const truncated = truncateToTokenBudget(longText, 100);
      expect(estimateTokens(truncated)).toBeLessThanOrEqual(100);
    });
  });

  describe('MAX_MEMORY_TOKENS', () => {
    it('is 400 per ADDENDUM spec', () => {
      expect(MAX_MEMORY_TOKENS).toBe(400);
    });
  });

  describe('composeMemoryContext — edge cases', () => {
    it('reste sous 400 tokens estimés pour un profil réel (heuristique 4 chars/token)', () => {
      const ctx = composeMemoryContext(mockProfile, { agentType: 'ENTRETIEN_OEUVRE' });
      const estimatedTokens = Math.ceil(ctx.length / 4);
      expect(estimatedTokens).toBeLessThanOrEqual(400);
    });

    it('fonctionne sans currentWorkMastery ni recentSessionsSummary', () => {
      const minimalProfile: MemoryProfile = {
        ...mockProfile,
        currentWorkMastery: null,
        recentSessionsSummary: null,
      };
      const ctx = composeMemoryContext(minimalProfile, { agentType: 'ENTRETIEN_OEUVRE' });
      expect(typeof ctx).toBe('string');
      expect(ctx.length).toBeGreaterThan(20);
      expect(ctx).toContain('PASSABLE');
    });

    it("ENTRETIEN_OEUVRE n'inclut pas les lacunes ORAL_GRAMM_ dans le contexte", () => {
      const profileWithGramm: MemoryProfile = {
        ...mockProfile,
        weakSkills: [
          { skill: 'ORAL_GRAMM_SUBORDONNEE', pattern: 'Erreurs subordonnées relatives', severity: 'HIGH', frequency: 3, lastOccurrenceDaysAgo: 2 },
          { skill: 'ORAL_ENTRETIEN_REACTIVITE', pattern: 'Hésitations longues', severity: 'CRITICAL', frequency: 5, lastOccurrenceDaysAgo: 1 },
        ],
      };
      const ctx = composeMemoryContext(profileWithGramm, { agentType: 'ENTRETIEN_OEUVRE' });
      expect(ctx).not.toContain('Erreurs subordonnées relatives');
      expect(ctx).not.toContain('ORAL_GRAMM_SUBORDONNEE');
      expect(ctx).toContain('Hésitations longues');
    });
  });

  describe('filterWeakSkillsByAgent — GRAMMAIRE_CIBLEE', () => {
    it('GRAMMAIRE_CIBLEE ne voit que les ORAL_GRAMM_', () => {
      const skills: WeakSkillSummary[] = [
        { skill: 'ORAL_GRAMM_SUBORDONNEE', pattern: 'Erreurs subordonnées', severity: 'HIGH', frequency: 3, lastOccurrenceDaysAgo: 2 },
        { skill: 'ORAL_ENTRETIEN_ARGUMENTATION', pattern: 'Argumentation faible', severity: 'MEDIUM', frequency: 2, lastOccurrenceDaysAgo: 5 },
        { skill: 'TRANS_LANGUE_PONCTUATION', pattern: 'Ponctuation incorrecte', severity: 'LOW', frequency: 1, lastOccurrenceDaysAgo: 14 },
      ];
      const filtered = filterWeakSkillsByAgent(skills, 'GRAMMAIRE_CIBLEE');
      expect(filtered.every((ws) => ws.skill.startsWith('ORAL_GRAMM_'))).toBe(true);
      expect(filtered.length).toBeGreaterThanOrEqual(1);
      expect(filtered[0].skill).toBe('ORAL_GRAMM_SUBORDONNEE');
    });
  });
});
