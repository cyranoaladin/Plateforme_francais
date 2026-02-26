import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/llm/factory', () => ({
  getRouterProvider: () => ({
    generateContent: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        feedback: 'Bonne présentation.',
        score: 7,
        max: 8,
        points_forts: ['Maîtrise du propos'],
        axes: ['Approfondir le contexte'],
        relance: "Qu'est-ce qui vous a touché dans cette œuvre ?",
      }),
    }),
  }),
}));

vi.mock('@/lib/llm/token-estimate', () => ({
  estimateTokens: vi.fn().mockReturnValue(200),
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { evaluateOralPhase } from '@/lib/oral/service';

describe('evaluateOralPhase — phase ENTRETIEN avec oeuvreChoisieEntretien', () => {
  it('retourne un score valide pour la phase ENTRETIEN', async () => {
    const result = await evaluateOralPhase({
      phase: 'ENTRETIEN',
      transcript: "J'ai choisi Manon Lescaut pour ses thèmes de passion et d'errance.",
      extrait: 'Extrait de test',
      questionGrammaire: 'Question test',
      oeuvre: 'Manon Lescaut',
      duration: 480,
      oeuvreChoisieEntretien: 'Manon Lescaut — Abbé Prévost',
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(8);
    expect(result.max).toBe(8);
    expect(Array.isArray(result.points_forts)).toBe(true);
  });

  it('le score ENTRETIEN est clampé à 8 maximum', async () => {
    const result = await evaluateOralPhase({
      phase: 'ENTRETIEN',
      transcript: 'Réponse brillante',
      extrait: '',
      questionGrammaire: '',
      oeuvre: 'Test',
      duration: 480,
    });
    expect(result.score).toBeLessThanOrEqual(8);
    expect(result.max).toBe(8);
  });

  it('fonctionne sans oeuvreChoisieEntretien (null)', async () => {
    const result = await evaluateOralPhase({
      phase: 'ENTRETIEN',
      transcript: 'Je présente mon œuvre.',
      extrait: 'Extrait',
      questionGrammaire: 'Q?',
      oeuvre: 'Cahier de Douai',
      duration: 300,
      oeuvreChoisieEntretien: null,
    });
    expect(result.score).toBeLessThanOrEqual(8);
  });
});

describe('evaluateOralPhase — phase GRAMMAIRE', () => {
  it('score GRAMMAIRE clampé à 2 maximum', async () => {
    vi.doMock('@/lib/llm/factory', () => ({
      getRouterProvider: () => ({
        generateContent: vi.fn().mockResolvedValue({
          content: JSON.stringify({
            feedback: 'Analyse correcte.',
            score: 2,
            max: 2,
            points_forts: ['Identification précise'],
            axes: [],
          }),
        }),
      }),
    }));

    const result = await evaluateOralPhase({
      phase: 'GRAMMAIRE',
      transcript:
        'Il s\'agit d\'une proposition subordonnée relative avec le pronom "qui" ayant pour antécédent "le poète".',
      extrait: 'Le poète qui dort est un rêveur.',
      questionGrammaire: 'Analysez la proposition relative dans ce vers.',
      oeuvre: 'Cahier de Douai',
      duration: 120,
    });
    expect(result.score).toBeLessThanOrEqual(2);
    expect(result.max).toBe(2);
  });

  it('phase LECTURE clampée à 2 maximum', async () => {
    const result = await evaluateOralPhase({
      phase: 'LECTURE',
      transcript: 'Lecture expressive et fluide.',
      extrait: 'Extrait.',
      questionGrammaire: '',
      oeuvre: 'Cahier de Douai',
      duration: 90,
    });
    expect(result.score).toBeLessThanOrEqual(2);
    expect(result.max).toBe(2);
  });

  it('phase EXPLICATION clampée à 8 maximum', async () => {
    const result = await evaluateOralPhase({
      phase: 'EXPLICATION',
      transcript: 'Explication linéaire détaillée.',
      extrait: 'Extrait.',
      questionGrammaire: '',
      oeuvre: 'Manon Lescaut',
      duration: 480,
    });
    expect(result.score).toBeLessThanOrEqual(8);
    expect(result.max).toBe(8);
  });
});
