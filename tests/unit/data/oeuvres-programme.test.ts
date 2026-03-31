import { describe, expect, it } from 'vitest';
import { getOeuvresForYear } from '@/data/oeuvres-programme';

describe('getOeuvresForYear', () => {
  it('retourne les oeuvres du programme pour une année connue', () => {
    const works = getOeuvresForYear('2025-2026');
    expect(works.length).toBeGreaterThan(0);
    expect(works).toContain("On ne badine pas avec l'amour — Alfred de Musset");
  });

  it('retourne un fallback sur la dernière année disponible si l’année n’est pas connue', () => {
    expect(getOeuvresForYear('2030-2031')).toEqual([
      'Programme 2026-2027 — à mettre à jour à la rentrée',
    ]);
  });
});
