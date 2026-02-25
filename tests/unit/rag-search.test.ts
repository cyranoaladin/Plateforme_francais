import { describe, expect, it } from 'vitest';
import { searchOfficialReferences } from '@/lib/rag/search';

describe('searchOfficialReferences', () => {
  it('renvoie des documents triés par pertinence pour une requête ciblée', async () => {
    const results = await searchOfficialReferences('explication linéaire');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title.toLowerCase()).toContain('explication');
    expect(results[0].score).toBeGreaterThanOrEqual(results[results.length - 1].score);
  });

  it('retourne une liste par défaut si la requête est vide', async () => {
    const results = await searchOfficialReferences('');

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.score === 0)).toBe(true);
  });
});
