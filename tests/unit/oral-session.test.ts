import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/llm/factory', () => ({
  getRouterProvider: vi.fn().mockReturnValue({
    generateContent: vi.fn().mockResolvedValue({
      text: JSON.stringify({
        note: 13,
        mention: 'Assez bien',
        phases: {
          lecture: { note: 4, commentaire: 'Lecture fluide.' },
          explication: { note: 5, commentaire: 'Analyse correcte.' },
          entretien: { note: 4, commentaire: 'Réponses pertinentes.' },
        },
        bilan_global: 'Prestation correcte.',
        conseil_final: 'Approfondir les procédés.',
      }),
      content: null,
      model: 'mock',
    }),
  }),
}));

vi.mock('@/lib/llm/token-estimate', () => ({
  estimateTokens: () => 200,
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('@/data/extraits-oeuvres', () => ({
  EXTRAITS_OEUVRES: [
    {
      oeuvre: 'Le Mariage forcé',
      extrait: 'Extrait test.',
      questionGrammaire: 'Question test.',
    },
  ],
}));

describe('Oral Service', () => {
  it('pickOralExtrait retourne un extrait valide', async () => {
    const { pickOralExtrait } = await import('@/lib/oral/service');
    const result = pickOralExtrait('Le Mariage forcé');
    expect(result.texte).toBe('Extrait test.');
    expect(result.questionGrammaire).toBe('Question test.');
  });

  it('pickOralExtrait retourne un fallback pour oeuvre inconnue', async () => {
    const { pickOralExtrait } = await import('@/lib/oral/service');
    const result = pickOralExtrait('Oeuvre inexistante');
    expect(result.texte).toBeTruthy();
    expect(result.questionGrammaire).toBeTruthy();
  });

  it('generateOralBilan retourne un résultat structuré', async () => {
    const { generateOralBilan } = await import('@/lib/oral/service');
    const session = {
      id: 'session-test',
      userId: 'user-test',
      oeuvre: 'Le Mariage forcé',
      extrait: 'Extrait',
      questionGrammaire: 'Question',
      interactions: [
        {
          step: 'LECTURE' as const,
          transcript: 'Ma lecture.',
          duration: 120,
          feedback: { feedback: 'Bien.', score: 4, max: 6, points_forts: [], axes: [] },
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      endedAt: null,
    };

    const result = await generateOralBilan(session);
    expect(result.note).toBeGreaterThanOrEqual(0);
    expect(result.note).toBeLessThanOrEqual(20);
    expect(result.mention).toBeTruthy();
    expect(result.phases).toBeDefined();
    expect(result.bilan_global).toBeTruthy();
  });
});
