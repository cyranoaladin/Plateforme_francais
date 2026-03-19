import { describe, it, expect } from 'vitest';
import {
  hasFullLibraryAccess,
  getLibraryLimit,
  isResourceAccessible,
  FREE_LIBRARY_LIMITS,
  FREE_TOTAL_LIMIT,
  LIBRARY_TOTAL_RESOURCES,
  FREE_LIBRARY_PERCENT,
  getLibraryPaywallMessage,
} from '@/lib/billing/library-gating';

describe('library-gating', () => {
  describe('hasFullLibraryAccess', () => {
    it('FREE n a pas l acces complet', () => {
      expect(hasFullLibraryAccess('FREE')).toBe(false);
    });
    it('PREMIUM a l acces complet', () => {
      expect(hasFullLibraryAccess('PREMIUM')).toBe(true);
    });
    it('PRO a l acces complet', () => {
      expect(hasFullLibraryAccess('PRO')).toBe(true);
    });
    it('MAX a l acces complet', () => {
      expect(hasFullLibraryAccess('MAX')).toBe(true);
    });
  });

  describe('getLibraryLimit', () => {
    it('FREE Annales_EAF = 2', () => {
      expect(getLibraryLimit('FREE', 'Annales_EAF')).toBe(2);
    });
    it('FREE Oeuvres = 1', () => {
      expect(getLibraryLimit('FREE', 'Oeuvres')).toBe(1);
    });
    it('FREE Videos = 16', () => {
      expect(getLibraryLimit('FREE', 'Videos')).toBe(16);
    });
    it('FREE Documents_Extraits = 8', () => {
      expect(getLibraryLimit('FREE', 'Documents_Extraits')).toBe(8);
    });
    it('FREE eaf_rapport_jury = 1', () => {
      expect(getLibraryLimit('FREE', 'eaf_rapport_jury')).toBe(1);
    });
    it('PRO = illimite (-1)', () => {
      expect(getLibraryLimit('PRO', 'Annales_EAF')).toBe(-1);
    });
    it('PREMIUM = illimite (-1)', () => {
      expect(getLibraryLimit('PREMIUM', 'Videos')).toBe(-1);
    });
    it('categorie inconnue FREE = 2 par defaut', () => {
      expect(getLibraryLimit('FREE', 'Unknown')).toBe(2);
    });
  });

  describe('isResourceAccessible', () => {
    it('FREE index 0 = accessible', () => {
      expect(isResourceAccessible('FREE', 'r1', 'Annales_EAF', 0)).toBe(true);
    });
    it('FREE index 1 Annales = accessible (limit 2)', () => {
      expect(isResourceAccessible('FREE', 'r2', 'Annales_EAF', 1)).toBe(true);
    });
    it('FREE index 2 Annales = bloque (limit 2)', () => {
      expect(isResourceAccessible('FREE', 'r3', 'Annales_EAF', 2)).toBe(false);
    });
    it('FREE index 15 Videos = accessible (limit 16)', () => {
      expect(isResourceAccessible('FREE', 'r16', 'Videos', 15)).toBe(true);
    });
    it('FREE index 16 Videos = bloque (limit 16)', () => {
      expect(isResourceAccessible('FREE', 'r17', 'Videos', 16)).toBe(false);
    });
    it('PRO index 100 = accessible', () => {
      expect(isResourceAccessible('PRO', 'r100', 'Videos', 100)).toBe(true);
    });
    it('PREMIUM index 100 = accessible', () => {
      expect(isResourceAccessible('PREMIUM', 'r100', 'Videos', 100)).toBe(true);
    });
  });

  describe('FREE_TOTAL_LIMIT — cible 5 % du catalogue', () => {
    it('est la somme des limites par categorie', () => {
      const sum = Object.values(FREE_LIBRARY_LIMITS).reduce((a, b) => a + b, 0);
      expect(FREE_TOTAL_LIMIT).toBe(sum);
    });
    it('est exactement 28 (5 % de 548)', () => {
      expect(FREE_TOTAL_LIMIT).toBe(28);
    });
    it('LIBRARY_TOTAL_RESOURCES = 548', () => {
      expect(LIBRARY_TOTAL_RESOURCES).toBe(548);
    });
    it('FREE_LIBRARY_PERCENT = 5', () => {
      expect(FREE_LIBRARY_PERCENT).toBe(5);
    });
  });

  describe('getLibraryPaywallMessage', () => {
    it('FREE retourne un message mentionnant le nombre de ressources', () => {
      const msg = getLibraryPaywallMessage('FREE');
      expect(msg).toContain('28');
      expect(msg).toContain('548');
      expect(msg).toContain('Premium');
    });
    it('FREE ne mentionne pas les anciens noms', () => {
      const msg = getLibraryPaywallMessage('FREE');
      expect(msg).not.toContain('Excellence');
      expect(msg).not.toContain('Réussite');
    });
    it('PRO retourne vide', () => {
      expect(getLibraryPaywallMessage('PRO')).toBe('');
    });
    it('PREMIUM retourne vide', () => {
      expect(getLibraryPaywallMessage('PREMIUM')).toBe('');
    });
  });
});
