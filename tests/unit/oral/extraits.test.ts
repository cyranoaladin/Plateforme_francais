import { describe, expect, it } from 'vitest';
import { EXTRAITS_OEUVRES } from '@/data/extraits-oeuvres';

describe('Banque d\'extraits officielles', () => {
  it('charge une liste non vide d\'oeuvres', () => {
    expect(Array.isArray(EXTRAITS_OEUVRES)).toBe(true);
    expect(EXTRAITS_OEUVRES.length).toBeGreaterThan(0);
  });
});
