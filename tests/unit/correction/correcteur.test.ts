import { describe, expect, it, vi } from 'vitest';
import { corrigerCopie } from '@/lib/correction/correcteur';

const { orchestrateMock } = vi.hoisted(() => ({ orchestrateMock: vi.fn() }));

vi.mock('@/lib/llm/orchestrator', () => ({ orchestrate: orchestrateMock }));

describe('corrigerCopie()', () => {
  it('retourne une structure complète avec note /20', async () => {
    orchestrateMock.mockResolvedValueOnce({
      note: 14,
      mention: 'Bien',
      bilan: { global: 'Bon ensemble', points_forts: ['analyse'], axes_amelioration: ['expression'] },
      rubriques: [
        { titre: 'Compréhension', note: 3, max: 4, appreciation: 'ok', conseils: ['c1'] },
        { titre: 'Analyse', note: 6, max: 8, appreciation: 'ok', conseils: ['c2'] },
        { titre: 'Langue', note: 3, max: 4, appreciation: 'ok', conseils: ['c3'] },
        { titre: 'Structure', note: 2, max: 4, appreciation: 'ok', conseils: ['c4'] },
      ],
      annotations: [],
      corrige_type: 'Exemple',
      conseil_final: 'Continue',
    });

    const out = await corrigerCopie({ texteOCR: '...', sujet: 'Sujet', typeEpreuve: 'commentaire', userId: 'u1' });
    expect(out.note).toBeGreaterThanOrEqual(0);
    expect(out.note).toBeLessThanOrEqual(20);
    expect(out.rubriques).toHaveLength(4);
  });
});
