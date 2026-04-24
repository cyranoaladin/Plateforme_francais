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
    const testCase = entry as any;
    const results = await searchOfficialReferences(testCase.query, 5);

    if (testCase.mustReturnEmpty) {
      expect(results.length).toBe(0);
      return;
    }

    expect(results.length).toBeGreaterThanOrEqual(testCase.minResults);
    const allText = results.map((r) => `${r.title} ${r.excerpt}`).join(' ').toLowerCase();

    if (testCase.mustContain) {
      for (const term of testCase.mustContain) {
        expect(allText).toContain(term.toLowerCase());
      }
    }

    if (testCase.mustContainAny) {
      expect(testCase.mustContainAny.some((term: string) => allText.includes(term.toLowerCase()))).toBe(true);
    }
  });
});
