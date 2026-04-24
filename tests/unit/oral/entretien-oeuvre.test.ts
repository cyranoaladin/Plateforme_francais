import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/llm/orchestrator', () => ({
  orchestrate: vi.fn().mockResolvedValue({
    feedback: 'Bonne présentation.',
    score: 7,
    max: 8,
    points_forts: ['Maîtrise du propos'],
    axes: ['Approfondir le contexte'],
    relance: "Qu'est-ce qui vous a touché dans cette œuvre ?",
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { orchestrate } from '@/lib/llm/orchestrator';
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
      userId: 'user-1',
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
      userId: 'user-1',
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
      userId: 'user-1',
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
      userId: 'user-1',
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
      userId: 'user-1',
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
      userId: 'user-1',
    });
    expect(result.score).toBeLessThanOrEqual(8);
    expect(result.max).toBe(8);
  });

  it('retombe sur un fallback sûr quand l’orchestrateur renvoie un payload anti-triche bloqué', async () => {
    vi.mocked(orchestrate).mockResolvedValueOnce({
      blocked: true,
      category: 'redaction_complete',
      message: 'Je ne peux pas rédiger un texte complet à ta place.',
      guidance: 'Je peux t’aider à construire un plan.',
      score: null,
      max: 8,
    });

    const result = await evaluateOralPhase({
      phase: 'EXPLICATION',
      transcript: 'Cet extrait montre que le quipu devient un support de mémoire.',
      extrait: 'Extrait.',
      questionGrammaire: '',
      oeuvre: "Lettres d'une Péruvienne",
      duration: 480,
      userId: 'user-test',
    });

    expect(result).toMatchObject({
      feedback: expect.any(String),
      score: 0,
      max: 8,
      points_forts: [],
      axes: expect.any(Array),
    });
    expect(result).not.toHaveProperty('blocked');
  });

  it('normalise une sortie d’entretien structurée par critères en évaluation exploitable', async () => {
    vi.mocked(orchestrate).mockResolvedValueOnce({
      feedback: {
        connaissance_de_l_oeuvre: "Tu maîtrises les thèmes majeurs de l'œuvre, mais il faut citer plus précisément les lettres.",
        reactivite: 'Ta réponse reste fluide, avec une relance bien intégrée.',
        culture_litteraire: 'La comparaison avec Montesquieu reste à développer.',
        esprit_critique: 'Ton point de vue personnel est nuancé et défendable.',
      },
      score: {
        connaissance_de_l_oeuvre: 2,
        reactivite: 1,
        culture_litteraire: 1,
        esprit_critique: 0.5,
      },
      max: {
        connaissance_de_l_oeuvre: 3,
        reactivite: 2,
        culture_litteraire: 2,
        esprit_critique: 1,
      },
      points_forts: {
        p1: 'Bonne connaissance de Zilia',
        p2: "Lien pertinent avec la question de l'identité",
        p3: 'Réponse personnelle assumée',
      },
      axes: {
        a1: 'Ajouter une comparaison avec Montesquieu',
        a2: 'Citer un passage précis de la lettre étudiée',
        a3: 'Structurer la réponse en deux mouvements',
      },
      relance: 'Quel passage précis montre le regard critique de Zilia sur l’Europe ?',
    });

    const result = await evaluateOralPhase({
      phase: 'ENTRETIEN',
      transcript:
        "Pour l'entretien, je relierais cet extrait à la critique des préjugés européens, à la question de l'identité et au statut de la femme dans le roman épistolaire.",
      extrait: 'Extrait.',
      questionGrammaire: '',
      oeuvre: "Lettres d'une Péruvienne",
      duration: 452,
      userId: 'user-test',
      oeuvreChoisieEntretien: "Lettres d'une Péruvienne",
    });

    expect(result.score).toBe(4.5);
    expect(result.max).toBe(8);
    expect(result.feedback).toContain("Connaissance de l'œuvre");
    expect(result.feedback).toContain('Esprit critique');
    expect(result.points_forts).toEqual([
      'Bonne connaissance de Zilia',
      "Lien pertinent avec la question de l'identité",
      'Réponse personnelle assumée',
    ]);
    expect(result.axes).toEqual([
      'Ajouter une comparaison avec Montesquieu',
      'Citer un passage précis de la lettre étudiée',
      'Structurer la réponse en deux mouvements',
    ]);
    expect(result.relance).toBe('Quel passage précis montre le regard critique de Zilia sur l’Europe ?');
  });
});
