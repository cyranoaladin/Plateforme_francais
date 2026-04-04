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

const { mockTexteDescriptifFindMany, mockOrchestrate } = vi.hoisted(() => ({
  mockTexteDescriptifFindMany: vi.fn(),
  mockOrchestrate: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  prisma: {
    texteDescriptif: {
      findMany: mockTexteDescriptifFindMany,
    },
  },
}));

const capturedOrchestrateInput: Array<{ context?: string; skill: string; userId: string; userQuery: string }> = [];
vi.mock('@/lib/llm/orchestrator', () => ({
  orchestrate: mockOrchestrate.mockImplementation((input: { context?: string; skill: string; userId: string; userQuery: string }) => {
    capturedOrchestrateInput.push(input);
    return Promise.resolve({
      feedback: 'Bonne prestation.',
      score: 7,
      max: 8,
      points_forts: ['Argumentation solide'],
      axes: ['Approfondir le contexte'],
    });
  }),
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
    capturedOrchestrateInput.length = 0;
    mockTexteDescriptifFindMany.mockReset();
    mockOrchestrate.mockClear();
    mockTexteDescriptifFindMany.mockResolvedValue(
      Array.from({ length: 20 }).map((_, i) => ({
        id: `d${i}`,
        oeuvreAuteur: i < 10 ? 'Baudelaire — Charles Baudelaire' : 'Rimbaud — Arthur Rimbaud',
        titreExtrait: `Texte ${i + 1}`,
        typeTexte: 'EXTRAIT_OEUVRE',
        incipit: i < 10 ? `Premières lignes Baudelaire ${i + 1}.` : `Premières lignes Rimbaud ${i + 1}.`,
        contenuTexte: null,
        position: i + 1,
      })),
    );
  });

  describe('pickOralExtrait', () => {
    it('retourne un texte et une question de grammaire', async () => {
      const result = await pickOralExtrait({
        oeuvre: 'Baudelaire',
        userId: 'user-test',
        mode: 'SIMULATION',
      });
      expect(result).toHaveProperty('texte');
      expect(result).toHaveProperty('questionGrammaire');
      expect(typeof result.texte).toBe('string');
      expect(result.texte.length).toBeGreaterThan(0);
    });

    it('échoue proprement pour une œuvre inconnue au lieu de choisir un texte aléatoire', async () => {
      mockTexteDescriptifFindMany.mockResolvedValueOnce([]);
      await expect(
        pickOralExtrait({
          oeuvre: 'OeuvreInexistante12345',
          userId: 'user-test',
          mode: 'FREE_PRACTICE',
        })
      ).rejects.toThrow("Aucun extrait exploitable");
    });

    it('utilise les premières lignes du descriptif si aucun extrait corpus ne correspond', async () => {
      mockTexteDescriptifFindMany.mockResolvedValueOnce([
        {
          id: 'dl1',
          oeuvreAuteur: 'Œuvre locale de test — Auteur Test',
          titreExtrait: 'Lettre III',
          typeTexte: 'EXTRAIT_OEUVRE',
          incipit: 'Zilia compare le quipu à une mémoire nouée et fidèle.',
          contenuTexte: null,
          position: 1,
        },
      ]);

      const result = await pickOralExtrait({
        oeuvre: 'Œuvre locale de test',
        userId: 'user-test',
        mode: 'SIMULATION',
      });

      expect(result.texte).toContain('mémoire nouée');
      expect(result.questionGrammaire).toContain('Lettre III');
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

      expect(capturedOrchestrateInput.length).toBeGreaterThan(0);
      const context = capturedOrchestrateInput[0]!.context ?? '';
      expect(context).toContain('Manon Lescaut — Abbé Prévost');
      expect(context).toContain("Œuvre choisie par l'élève");
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

      expect(capturedOrchestrateInput.length).toBeGreaterThan(0);
      const context = capturedOrchestrateInput[0]!.context ?? '';
      expect(context).toContain('Non renseignée');
    });
  });
});
