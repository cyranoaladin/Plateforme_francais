import { describe, it, expect } from 'vitest';
import { reciprocalRankFusion, metadataRerank } from '@/lib/rag/rerank';
import { type RagSearchResult } from '@/lib/rag/search';

function mockResult(id: string, title: string, score: number): RagSearchResult {
  return { id, title, type: 'texte_officiel', level: 'premiere', excerpt: '', url: '', score };
}

describe('RAG Reranking V2', () => {
  describe('reciprocalRankFusion', () => {
    it('merges two ranked lists by RRF score', () => {
      const listA = [mockResult('a', 'Doc A', 0.9), mockResult('b', 'Doc B', 0.7)];
      const listB = [mockResult('b', 'Doc B', 0.8), mockResult('c', 'Doc C', 0.6)];
      const fused = reciprocalRankFusion(listA, listB);

      expect(fused.length).toBe(3);
      // 'b' appears in both lists => higher RRF score
      expect(fused[0].id).toBe('b');
    });

    it('returns empty for empty lists', () => {
      expect(reciprocalRankFusion([], [])).toEqual([]);
    });

    it('handles single list', () => {
      const list = [mockResult('x', 'X', 1)];
      const fused = reciprocalRankFusion(list);
      expect(fused).toHaveLength(1);
      expect(fused[0].id).toBe('x');
    });
  });

  describe('metadataRerank', () => {
    it('boosts results matching oeuvre', () => {
      const results = [
        mockResult('a', 'Les Fleurs du Mal', 0.5),
        mockResult('b', 'Le Rouge et le Noir', 0.6),
      ];
      const reranked = metadataRerank(results, { oeuvre: 'Les Fleurs du Mal' });
      expect(reranked[0].id).toBe('a');
      expect(reranked[0].score).toBeGreaterThan(0.5);
    });

    it('boosts results matching parcours', () => {
      const results = [
        mockResult('a', 'Alchimie poétique', 0.3),
        mockResult('b', 'Autre chose', 0.4),
      ];
      const reranked = metadataRerank(results, { parcours: 'Alchimie' });
      expect(reranked[0].id).toBe('a');
    });

    it('returns unchanged results without context', () => {
      const results = [mockResult('b', 'B', 0.6), mockResult('a', 'A', 0.5)];
      const reranked = metadataRerank(results);
      expect(reranked).toBe(results); // same reference, no reordering
    });
  });
});
