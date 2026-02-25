/**
 * RAG Reranking V2 — Per cahier des charges V2 P0-4.
 *
 * Reciprocal Rank Fusion (RRF) to merge vector + lexical results,
 * then metadata-based rerank with boost for same oeuvre/parcours.
 */

import { type RagSearchResult } from '@/lib/rag/search';

const RRF_K = 60;

/**
 * Reciprocal Rank Fusion: merge multiple ranked lists into one.
 * Score = sum(1 / (k + rank_i)) across all lists.
 */
export function reciprocalRankFusion(
  ...lists: RagSearchResult[][]
): RagSearchResult[] {
  const scores = new Map<string, { result: RagSearchResult; score: number }>();

  for (const list of lists) {
    for (let rank = 0; rank < list.length; rank++) {
      const item = list[rank];
      const rrfScore = 1 / (RRF_K + rank + 1);
      const existing = scores.get(item.id);
      if (existing) {
        existing.score += rrfScore;
      } else {
        scores.set(item.id, { result: item, score: rrfScore });
      }
    }
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map((entry) => ({ ...entry.result, score: entry.score }));
}

/**
 * Metadata-based rerank: boost results matching the target oeuvre/parcours.
 * Boost = +0.2 for same oeuvre, +0.1 for same parcours.
 */
export function metadataRerank(
  results: RagSearchResult[],
  context?: { oeuvre?: string; parcours?: string },
): RagSearchResult[] {
  if (!context || (!context.oeuvre && !context.parcours)) return results;

  return results
    .map((r) => {
      let boost = 0;
      const titleLower = r.title.toLowerCase();
      if (context.oeuvre && titleLower.includes(context.oeuvre.toLowerCase())) {
        boost += 0.2;
      }
      if (context.parcours && titleLower.includes(context.parcours.toLowerCase())) {
        boost += 0.1;
      }
      return { ...r, score: r.score + boost };
    })
    .sort((a, b) => b.score - a.score);
}
