import { describe, expect, it } from 'vitest';
import { searchOfficialReferences } from '@/lib/rag/search';

const GOLDEN_CASES = [
  {
    query: 'barème oral EAF',
    mustContain: ['oral /20', 'entretien'],
    minResults: 1,
  },
  {
    query: 'méthode dissertation première',
    mustContain: ['dissertation', 'problematique'],
    minResults: 1,
  },
  {
    query: 'rimbaud poesie',
    mustContainAny: ['rimbaud', 'poesie', 'oeuvre'],
    minResults: 1,
  },
  {
    query: 'zzzz recette de cuisine aux truffes zzzz',
    mustReturnEmpty: true,
  },
] as const;

describe('RAG Golden Queries', () => {
  it.each(GOLDEN_CASES)('query "$query" respecte le comportement attendu', async (entry) => {
    const results = await searchOfficialReferences(entry.query, 5);

    if (entry.mustReturnEmpty) {
      expect(results.length).toBe(0);
      return;
    }

    expect(results.length).toBeGreaterThanOrEqual(entry.minResults);
    const allText = results.map((r) => `${r.title} ${r.excerpt}`).join(' ').toLowerCase();

    if (entry.mustContain) {
      for (const term of entry.mustContain) {
        expect(allText).toContain(term.toLowerCase());
      }
    }

    if (entry.mustContainAny) {
      expect(entry.mustContainAny.some((term) => allText.includes(term.toLowerCase()))).toBe(true);
    }
  });
});
