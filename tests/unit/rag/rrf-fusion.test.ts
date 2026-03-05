import { describe, expect, it } from 'vitest';
import { reciprocalRankFusion } from '@/lib/rag/rerank';

describe('RRF fusion edge cases', () => {
  it('fusionne 2 listes avec ids communs', () => {
    const a = [
      { id: 'x', title: 'X', type: 'texte_officiel', level: 'Niveau B', sourceRef: 's', excerpt: 'e', score: 1 },
      { id: 'y', title: 'Y', type: 'texte_officiel', level: 'Niveau B', sourceRef: 's', excerpt: 'e', score: 1 },
    ] as const;
    const b = [
      { id: 'y', title: 'Y', type: 'texte_officiel', level: 'Niveau B', sourceRef: 's', excerpt: 'e', score: 1 },
    ] as const;

    const fused = reciprocalRankFusion([...a], [...b]);
    expect(fused[0]?.id).toBe('y');
  });

  it('gère les listes vides', () => {
    expect(reciprocalRankFusion([], [])).toEqual([]);
  });
});
