import { describe, it, expect } from 'vitest';
import {
  BAREME_COMMENTAIRE_SERIE_GENERALE,
  BAREME_DISSERTATION,
  BAREME_GRAMMAIRE,
} from '@/data/baremes-officiels';

describe('Barèmes officiels EAF', () => {
  describe('Commentaire', () => {
    it('totalise 20 points', () => {
      const sum = BAREME_COMMENTAIRE_SERIE_GENERALE.criteres.reduce((acc, c) => acc + c.points, 0);
      expect(sum).toBe(20);
      expect(BAREME_COMMENTAIRE_SERIE_GENERALE.total).toBe(20);
    });

    it("n'a pas de critère 'introduction' ou 'conclusion' comme item autonome", () => {
      const ids = BAREME_COMMENTAIRE_SERIE_GENERALE.criteres.map(c => c.id.toLowerCase());
      expect(ids).not.toContain('introduction');
      expect(ids).not.toContain('conclusion');
      const labels = BAREME_COMMENTAIRE_SERIE_GENERALE.criteres.map(c => c.label.toLowerCase());
      expect(labels.some(l => l === 'introduction')).toBe(false);
      expect(labels.some(l => l === 'conclusion')).toBe(false);
    });

    it('a 4 critères exacts selon les échelles descriptives', () => {
      expect(BAREME_COMMENTAIRE_SERIE_GENERALE.criteres).toHaveLength(4);
      expect(BAREME_COMMENTAIRE_SERIE_GENERALE.criteres.map(c => c.id)).toEqual([
        'comprehension_interpretation',
        'construction_reflexion',
        'culture_litteraire',
        'maitrise_langue',
      ]);
    });

    it('chaque critère a 4 niveaux', () => {
      for (const critere of BAREME_COMMENTAIRE_SERIE_GENERALE.criteres) {
        expect(critere.niveaux).toHaveLength(4);
      }
    });

    it("la construction de la réflexion pèse 6 pts", () => {
      const c = BAREME_COMMENTAIRE_SERIE_GENERALE.criteres.find(c => c.id === 'construction_reflexion');
      expect(c?.points).toBe(6);
    });
  });

  describe('Dissertation', () => {
    it('totalise 20 points', () => {
      const sum = BAREME_DISSERTATION.criteres.reduce((acc, c) => acc + c.points, 0);
      expect(sum).toBe(20);
    });

    it('la construction argumentative pèse 8 pts (poids principal)', () => {
      const c = BAREME_DISSERTATION.criteres.find(c => c.id === 'construction_reflexion');
      expect(c?.points).toBe(8);
    });

    it('a 4 critères', () => {
      expect(BAREME_DISSERTATION.criteres).toHaveLength(4);
    });
  });

  describe('Grammaire', () => {
    it('est sur 2 points, 3 niveaux', () => {
      expect(BAREME_GRAMMAIRE.total).toBe(2);
      expect(BAREME_GRAMMAIRE.criteres[0].niveaux).toHaveLength(3);
    });
  });
});
