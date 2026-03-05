import { describe, expect, it, vi } from 'vitest';
import { corrigerCopie } from '@/lib/correction/correcteur';

const { orchestrateMock } = vi.hoisted(() => ({ orchestrateMock: vi.fn() }));
vi.mock('@/lib/llm/orchestrator', () => ({ orchestrate: orchestrateMock }));

describe('Rubriques correction', () => {
  it('respecte la somme des rubriques /20', async () => {
    orchestrateMock.mockResolvedValueOnce({
      note: 12,
      mention: 'Passable',
      bilan: { global: 'Bilan', points_forts: [], axes_amelioration: [] },
      rubriques: [
        { titre: 'R1', note: 2, max: 4, appreciation: 'a', conseils: ['x'] },
        { titre: 'R2', note: 5, max: 8, appreciation: 'a', conseils: ['x'] },
        { titre: 'R3', note: 2, max: 4, appreciation: 'a', conseils: ['x'] },
        { titre: 'R4', note: 3, max: 4, appreciation: 'a', conseils: ['x'] },
      ],
      annotations: [],
      corrige_type: 'x',
      conseil_final: 'x',
    });

    const out = await corrigerCopie({ texteOCR: '...', sujet: 'Sujet', typeEpreuve: 'commentaire', userId: 'u1' });
    const totalMax = out.rubriques.reduce((s, r) => s + r.max, 0);
    const totalNote = out.rubriques.reduce((s, r) => s + r.note, 0);
    expect(totalMax).toBe(20);
    expect(out.note).toBe(totalNote);
  });
});
