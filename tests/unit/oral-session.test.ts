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

vi.mock('@/lib/db/client', () => ({
  prisma: {
    studentProfile: {
      findUnique: vi.fn().mockResolvedValue({ id: 'profile-test' }),
    },
    descriptifTexte: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    textePrepare: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
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
  it('pickOralExtrait privilégie le descriptif élève quand il existe', async () => {
    vi.doMock('@/lib/db/client', () => ({
      prisma: {
        studentProfile: {
          findUnique: vi.fn().mockResolvedValue({ id: 'profile-test' }),
        },
        descriptifTexte: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'd1',
              oeuvre: 'Le Mariage forcé',
              auteur: 'Molière',
              titre: 'Scène 1',
              typeExtrait: 'extrait_oeuvre',
              premieresLignes: 'Sganarelle expose ses doutes avec une énergie déjà comique.',
            },
          ]),
        },
        textePrepare: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    }));
    vi.doMock('@/data/extraits-oeuvres', () => ({
      EXTRAITS_OEUVRES: [
        {
          oeuvre: 'Le Mariage forcé',
          extrait: 'Extrait corpus sans priorité.',
          questionGrammaire: 'Question corpus.',
        },
      ],
    }));
    vi.resetModules();

    const { pickOralExtrait } = await import('@/lib/oral/service');
    const result = await pickOralExtrait({
      oeuvre: 'Le Mariage forcé',
      userId: 'user-test',
      mode: 'SIMULATION',
    });
    expect(result.texte).toContain('Sganarelle expose ses doutes');
    expect(result.questionGrammaire).toContain('Scène 1');
  });

  it('pickOralExtrait échoue proprement pour une œuvre inconnue', async () => {
    vi.doMock('@/lib/db/client', () => ({
      prisma: {
        studentProfile: {
          findUnique: vi.fn().mockResolvedValue({ id: 'profile-test' }),
        },
        descriptifTexte: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        textePrepare: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    }));
    vi.doMock('@/data/extraits-oeuvres', () => ({
      EXTRAITS_OEUVRES: [],
    }));
    vi.resetModules();

    const { pickOralExtrait } = await import('@/lib/oral/service');
    await expect(pickOralExtrait({
      oeuvre: 'Oeuvre inexistante',
      userId: 'user-test',
      mode: 'FREE_PRACTICE',
    })).rejects.toThrow("Aucun extrait exploitable");
  });

  it('pickOralExtrait utilise les premières lignes du descriptif si le corpus ne couvre pas l\'œuvre', async () => {
    vi.doMock('@/lib/db/client', () => ({
      prisma: {
        studentProfile: {
          findUnique: vi.fn().mockResolvedValue({ id: 'profile-test' }),
        },
        descriptifTexte: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'd1',
              oeuvre: "Lettres d'une Péruvienne",
              auteur: 'Graffigny',
              titre: 'Lettre II',
              typeExtrait: 'extrait_oeuvre',
              premieresLignes: 'Zilia écrit à Aza et décrit le quipu comme un lien vivant avec sa mémoire.',
            },
            { id: 'd2', oeuvre: 'Autre œuvre', auteur: 'Autre', titre: 'Texte 2', typeExtrait: 'extrait_oeuvre', premieresLignes: '...' },
            { id: 'd3', oeuvre: 'Autre œuvre', auteur: 'Autre', titre: 'Texte 3', typeExtrait: 'extrait_parcours', premieresLignes: '...' },
          ]),
        },
        textePrepare: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    }));
    vi.doMock('@/data/extraits-oeuvres', () => ({
      EXTRAITS_OEUVRES: [],
    }));
    vi.resetModules();

    const { pickOralExtrait } = await import('@/lib/oral/service');
    const result = await pickOralExtrait({
      oeuvre: "Lettres d'une Péruvienne",
      userId: 'user-test',
      mode: 'SIMULATION',
    });
    expect(result.texte).toContain('Zilia écrit à Aza');
    expect(result.questionGrammaire).toContain('Lettre II');
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
