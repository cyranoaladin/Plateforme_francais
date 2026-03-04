import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock external deps not installed in test env
vi.mock('pino', () => {
  const noop = () => {};
  const mock = { info: noop, warn: noop, error: noop, debug: noop, child: () => mock };
  return { default: () => mock };
});

vi.mock('@prisma/client', () => ({
  PrismaClient: class { $queryRaw = async () => []; },
}));

// Capture LLM messages for evaluateOralPhase integration tests
const capturedMessages: Array<Array<{ role: string; content: string }>> = [];
const mockGenerateContent = vi.fn().mockImplementation(
  (messages: Array<{ role: string; content: string }>) => {
    capturedMessages.push(messages);
    return Promise.resolve({
      content: JSON.stringify({
        feedback: 'Bonne prestation.',
        score: 7,
        max: 8,
        points_forts: ['Argumentation solide'],
        axes: ['Approfondir le contexte'],
      }),
    });
  },
);

vi.mock('@/lib/llm/factory', () => ({
  getRouterProvider: () => ({ generateContent: mockGenerateContent }),
}));

vi.mock('@/lib/llm/token-estimate', () => ({
  estimateTokens: vi.fn().mockReturnValue(200),
}));

import { pickOralExtrait, evaluateOralPhase, type Citation } from '@/lib/oral/service';
import {
  computeOralScore,
  computeMention,
  clampPhaseScore,
  PHASE_MAX_SCORES,
} from '@/lib/oral/scoring';

describe('Oral Session Flow — integration', () => {
  beforeEach(() => {
    capturedMessages.length = 0;
    mockGenerateContent.mockClear();
  });

  describe('pickOralExtrait', () => {
    it('retourne un texte et une question de grammaire', () => {
      const result = pickOralExtrait('Baudelaire');
      expect(result).toHaveProperty('texte');
      expect(result).toHaveProperty('questionGrammaire');
      expect(typeof result.texte).toBe('string');
      expect(result.texte.length).toBeGreaterThan(0);
    });

    it('retourne un extrait même pour une oeuvre inconnue (fallback)', () => {
      const result = pickOralExtrait('OeuvreInexistante12345');
      expect(result.texte.length).toBeGreaterThan(0);
    });
  });

  describe('scoring', () => {
    it('computeOralScore somme correctement 4 phases', () => {
      const result = computeOralScore([
        { phase: 'LECTURE', score: 2, maxScore: 2 },
        { phase: 'EXPLICATION', score: 8, maxScore: 8 },
        { phase: 'GRAMMAIRE', score: 2, maxScore: 2 },
        { phase: 'ENTRETIEN', score: 8, maxScore: 8 },
      ]);
      expect(result.total).toBe(20);
      expect(result.maxTotal).toBe(20);
    });

    it('clampPhaseScore borne la note entre 0 et max', () => {
      expect(clampPhaseScore('LECTURE', 10)).toBe(PHASE_MAX_SCORES.LECTURE);
      expect(clampPhaseScore('LECTURE', -5)).toBe(0);
      expect(clampPhaseScore('EXPLICATION', 6)).toBe(6);
    });

    it('computeMention retourne les mentions officielles', () => {
      expect(computeMention(20)).toBe('Très bien');
      expect(computeMention(16)).toBe('Très bien');
      expect(computeMention(14)).toBe('Bien');
      expect(computeMention(12)).toBe('Assez bien');
      expect(computeMention(10)).toBe('Passable');
      expect(computeMention(5)).toBe('Insuffisant');
    });
  });

  describe('Citation type (BUG-CRIT-01 cascade)', () => {
    it('Citation type n\'a plus de champ url', () => {
      const citation: Citation = {
        title: 'Test',
        source_interne: 'BO 2025',
        snippet: 'Extrait test.',
      };
      expect(citation).toHaveProperty('source_interne');
      expect(citation).not.toHaveProperty('url');
    });
  });

  describe('evaluateOralPhase — injection oeuvreChoisieEntretien dans le prompt', () => {
    it('injecte oeuvreChoisieEntretien dans le message user pour ENTRETIEN', async () => {
      await evaluateOralPhase({
        phase: 'ENTRETIEN',
        transcript: "J'ai choisi Manon Lescaut pour ses thèmes de passion et d'errance.",
        extrait: 'Extrait du roman.',
        questionGrammaire: 'Analysez la subordonnée.',
        oeuvre: 'Manon Lescaut',
        duration: 480,
        oeuvreChoisieEntretien: 'Manon Lescaut — Abbé Prévost',
      });

      expect(capturedMessages.length).toBeGreaterThan(0);
      const userMsg = capturedMessages[0]!.find((m) => m.role === 'user')?.content ?? '';
      expect(userMsg).toContain('Manon Lescaut — Abbé Prévost');
      expect(userMsg).toContain('œuvre choisie');
      expect(userMsg).toContain("NE PAS questionner sur l'extrait");
    });

    it("mentionne l'invitation à renseigner l'œuvre si oeuvreChoisieEntretien est null", async () => {
      await evaluateOralPhase({
        phase: 'ENTRETIEN',
        transcript: 'Je présente une œuvre.',
        extrait: 'Extrait.',
        questionGrammaire: 'Q?',
        oeuvre: 'Cahier de Douai',
        duration: 300,
        oeuvreChoisieEntretien: null,
      });

      expect(capturedMessages.length).toBeGreaterThan(0);
      const userMsg = capturedMessages[0]!.find((m) => m.role === 'user')?.content ?? '';
      expect(userMsg).toContain("n'a pas encore renseigné son œuvre choisie");
    });
  });
});
