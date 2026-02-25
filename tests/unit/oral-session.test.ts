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
    const phaseInputs = [
      { phase: 'LECTURE' as const, score: 1.5, maxScore: 2 },
      { phase: 'EXPLICATION' as const, score: 5, maxScore: 8 },
      { phase: 'GRAMMAIRE' as const, score: 1, maxScore: 2 },
      { phase: 'ENTRETIEN' as const, score: 5, maxScore: 8 },
    ];
    const phaseDetails: Record<string, { feedback: string }> = {
      LECTURE: { feedback: 'Lecture fluide.' },
      EXPLICATION: { feedback: 'Analyse correcte.' },
      GRAMMAIRE: { feedback: 'Bonne maîtrise.' },
      ENTRETIEN: { feedback: 'Réponses pertinentes.' },
    };

    const result = await generateOralBilan(phaseInputs, phaseDetails);
    expect(result.note).toBeGreaterThanOrEqual(0);
    expect(result.note).toBeLessThanOrEqual(20);
    expect(result.note).toBe(12.5);
    expect(result.maxNote).toBe(20);
    expect(result.mention).toBeTruthy();
    expect(result.phases).toBeDefined();
    expect(result.phases.lecture.max).toBe(2);
    expect(result.phases.explication.max).toBe(8);
    expect(result.phases.grammaire.max).toBe(2);
    expect(result.phases.entretien.max).toBe(8);
    expect(result.bilan_global).toBeTruthy();
    expect(result.conseil_final).toBeTruthy();
  });
});
