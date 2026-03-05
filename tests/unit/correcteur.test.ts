import { describe, expect, it, vi } from 'vitest';
import { corrigerCopie } from '@/lib/correction/correcteur';

const { orchestrateMock } = vi.hoisted(() => ({ orchestrateMock: vi.fn() }));

vi.mock('@/lib/llm/orchestrator', () => ({
  orchestrate: orchestrateMock,
}));

describe('corrigerCopie', () => {
  it('appelle l orchestrateur avec le skill correcteur et retourne le JSON', async () => {
    const expected = {
      note: 14,
      mention: 'Bien',
      bilan: {
        global: 'Copie solide.',
        points_forts: ['Analyse'],
        axes_amelioration: ['Expression'],
      },
      rubriques: [],
      annotations: [],
      corrige_type: 'Exemple',
      conseil_final: 'Continuez.',
    };

    orchestrateMock.mockResolvedValueOnce(expected);

    const result = await corrigerCopie({
      texteOCR: 'Texte élève',
      sujet: 'Sujet EAF',
      typeEpreuve: 'commentaire',
      userId: 'user-1',
    });

    expect(result).toEqual(expected);
    expect(orchestrateMock).toHaveBeenCalledTimes(1);
    expect(orchestrateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skill: 'correcteur',
        userId: 'user-1',
      }),
    );
  });
});
