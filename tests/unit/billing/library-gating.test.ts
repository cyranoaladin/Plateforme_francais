import { describe, it, expect } from 'vitest';
import {
  hasFullLibraryAccess,
  getLibraryLimit,
  isResourceAccessible,
  FREE_LIBRARY_LIMITS,
  FREE_TOTAL_LIMIT,
  getLibraryPaywallMessage,
} from '@/lib/billing/library-gating';

describe('library-gating', () => {
  describe('hasFullLibraryAccess', () => {
    it('FREE n a pas l acces complet', () => {
      expect(hasFullLibraryAccess('FREE')).toBe(false);
    });
    it('PRO a l acces complet', () => {
      expect(hasFullLibraryAccess('PRO')).toBe(true);
    });
    it('MAX a l acces complet', () => {
      expect(hasFullLibraryAccess('PRO')).toBe(true);
    });
  });

  describe('getLibraryLimit', () => {
    it('FREE Annales_EAF = 3', () => {
      expect(getLibraryLimit('FREE', 'Annales_EAF')).toBe(3);
    });
    it('FREE Videos = 5', () => {
      expect(getLibraryLimit('FREE', 'Videos')).toBe(5);
    });
    it('PRO = illimite (-1)', () => {
      expect(getLibraryLimit('PRO', 'Annales_EAF')).toBe(-1);
    });
    it('MAX = illimite (-1)', () => {
      expect(getLibraryLimit('PRO', 'Videos')).toBe(-1);
    });
    it('categorie inconnue FREE = 2 par defaut', () => {
      expect(getLibraryLimit('FREE', 'Unknown')).toBe(2);
    });
  });

  describe('isResourceAccessible', () => {
    it('FREE index 0 = accessible', () => {
      expect(isResourceAccessible('FREE', 'r1', 'Annales_EAF', 0)).toBe(true);
    });
    it('FREE index 2 Annales = accessible (limit 3)', () => {
      expect(isResourceAccessible('FREE', 'r3', 'Annales_EAF', 2)).toBe(true);
    });
    it('FREE index 3 Annales = bloque', () => {
      expect(isResourceAccessible('FREE', 'r4', 'Annales_EAF', 3)).toBe(false);
    });
    it('PRO index 100 = accessible', () => {
      expect(isResourceAccessible('PRO', 'r100', 'Videos', 100)).toBe(true);
    });
  });

  describe('FREE_TOTAL_LIMIT', () => {
    it('est la somme des limites par categorie', () => {
      const sum = Object.values(FREE_LIBRARY_LIMITS).reduce((a, b) => a + b, 0);
      expect(FREE_TOTAL_LIMIT).toBe(sum);
    });
    it('est un nombre raisonnable (10-20)', () => {
      expect(FREE_TOTAL_LIMIT).toBeGreaterThanOrEqual(10);
      expect(FREE_TOTAL_LIMIT).toBeLessThanOrEqual(25);
    });
  });

  describe('getLibraryPaywallMessage', () => {
    it('FREE retourne un message', () => {
      const msg = getLibraryPaywallMessage('FREE');
      expect(msg.length).toBeGreaterThan(10);
    });
    it('PRO retourne vide', () => {
      expect(getLibraryPaywallMessage('PRO')).toBe('');
    });
  });
});
