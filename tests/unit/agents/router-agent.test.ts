import { describe, it, expect } from 'vitest';
import { classifyIntent } from '@/lib/agents/router';

describe('classifyIntent — routage par mot-clé', () => {
  describe('Catégorie methode', () => {
    it.each([
      ['Comment faire un plan ?', 'methode'],
      ['Je veux travailler mon introduction', 'methode'],
      ['Conseils pour la conclusion', 'methode'],
      ['Stratégie pour le brouillon', 'methode'],
    ])('"%s" → %s', (query, expected) => {
      expect(classifyIntent(query)).toBe(expected);
    });
  });

  describe('Catégorie entrainement_ecrit', () => {
    it.each([
      ['Je veux rédiger un commentaire', 'entrainement_ecrit'],
      ['Aide-moi pour la dissertation', 'entrainement_ecrit'],
      ["Sujet d'analyse de texte", 'entrainement_ecrit'],
    ])('"%s" → %s', (query, expected) => {
      expect(classifyIntent(query)).toBe(expected);
    });
  });

  describe('Catégorie entrainement_oral', () => {
    it.each([
      ["Simulation d'oral s'il vous plaît", 'entrainement_oral'],
      ['Explication linéaire du poème', 'entrainement_oral'],
      ['Préparer mon entretien avec le jury', 'entrainement_oral'],
    ])('"%s" → %s', (query, expected) => {
      expect(classifyIntent(query)).toBe(expected);
    });
  });

  describe('Catégorie langue', () => {
    it.each([
      ['Analyser la subordonnée relative', 'langue'],
      ['La négation dans cette phrase', 'langue'],
      ['Identifier la syntaxe de la phrase complexe', 'langue'],
    ])('"%s" → %s', (query, expected) => {
      expect(classifyIntent(query)).toBe(expected);
    });
  });

  describe('Catégorie oeuvre', () => {
    it.each([
      ['Le Dormeur du val de Rimbaud', 'oeuvre'],
      ['Parcours poésie session 2026', 'oeuvre'],
      ["Auteur et contexte de l'œuvre", 'oeuvre'],
    ])('"%s" → %s', (query, expected) => {
      expect(classifyIntent(query)).toBe(expected);
    });
  });

  describe('Catégorie bibliotheque', () => {
    it.each([
      ['Chercher un document officiel', 'bibliotheque'],
      ['Référence Éduscol pour le barème', 'bibliotheque'],
      ['Source officielle sur le règlement', 'bibliotheque'],
    ])('"%s" → %s', (query, expected) => {
      expect(classifyIntent(query)).toBe(expected);
    });
  });

  describe('Catégorie diagnostic', () => {
    it.each([
      ['Faire mon bilan initial', 'diagnostic'],
      ['Évaluation de positionnement', 'diagnostic'],
      ['Mon niveau EAF', 'diagnostic'],
    ])('"%s" → %s', (query, expected) => {
      expect(classifyIntent(query)).toBe(expected);
    });
  });

  describe('Catégorie unknown', () => {
    it('retourne unknown pour une entrée vide', () => {
      expect(classifyIntent('')).toBe('unknown');
    });

    it('retourne unknown pour du texte sans correspondance', () => {
      expect(classifyIntent('bonjour comment vas-tu')).toBe('unknown');
    });
  });

  describe('Robustesse accents', () => {
    it('fonctionne avec et sans accents — méthode vs methode', () => {
      expect(classifyIntent('méthode dissertation')).toBe(classifyIntent('methode dissertation'));
    });

    it('est insensible à la casse', () => {
      expect(classifyIntent('ORAL SIMULATION')).toBe('entrainement_oral');
    });
  });

  describe('Ambiguïté — mot-clé le plus long gagne', () => {
    it("explication linéaire (oral) l'emporte sur explication seule", () => {
      const result = classifyIntent("Préparer l'explication linéaire du poème");
      expect(result).toBe('entrainement_oral');
    });
  });
});
