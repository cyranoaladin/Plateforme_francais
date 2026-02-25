import { describe, it, expect } from 'vitest';
import { classifyAntiTriche, buildRefusalOutput, FORBIDDEN_PATTERNS } from '@/lib/compliance/anti-triche';

describe('classifyAntiTriche', () => {
  describe('allowed requests (legitimate pedagogy)', () => {
    it.each([
      'Comment structurer une introduction de commentaire ?',
      'Quels procédés stylistiques dans cet extrait de Hugo ?',
      'Aide-moi à améliorer mon paragraphe sur la métaphore.',
      'Donne-moi des pistes pour analyser ce texte.',
      'Corrige mes fautes de grammaire dans ce paragraphe.',
      'Explique-moi la méthode du commentaire linéaire.',
      'Quelles sont les figures de style dans ce passage ?',
      'Propose-moi un plan pour cette dissertation.',
      '',
    ])('allows: "%s"', (query: string) => {
      const result = classifyAntiTriche(query);
      expect(result.allowed).toBe(true);
      expect(result.category).toBeUndefined();
    });
  });

  describe('blocked requests (redaction_complete)', () => {
    it.each([
      'Rédige moi une dissertation sur le romantisme.',
      'Rédige une explication linéaire de cet extrait.',
      'Écris moi un commentaire composé sur ce texte.',
      'Écris un essai sur la condition humaine.',
      'Fais moi une dissertation sur Molière.',
      'rédige une contraction de ce texte',
    ])('blocks: "%s"', (query: string) => {
      const result = classifyAntiTriche(query);
      expect(result.allowed).toBe(false);
      expect(result.category).toBe('redaction_complete');
      expect(result.refusalMessage).toBeTruthy();
      expect(result.guidanceMessage).toBeTruthy();
    });
  });

  describe('blocked requests (copie_complete)', () => {
    it.each([
      'Donne moi une copie complète de dissertation.',
      'Donne-moi une rédaction complète sur ce sujet.',
      'Corrigé type complet du commentaire.',
      'Génère une copie complète pour le bac.',
      'Génère une rédaction prête à rendre.',
    ])('blocks: "%s"', (query: string) => {
      const result = classifyAntiTriche(query);
      expect(result.allowed).toBe(false);
      expect(result.category).toBe('copie_complete');
    });
  });

  describe('blocked requests (substitution)', () => {
    it.each([
      'Réponds à ma place pour cet exercice.',
      'Fais mon devoir à ma place.',
      'Fais le travail à ma place.',
    ])('blocks: "%s"', (query: string) => {
      const result = classifyAntiTriche(query);
      expect(result.allowed).toBe(false);
      expect(result.category).toBe('substitution');
    });
  });

  it('returns guidance messages for blocked requests', () => {
    const result = classifyAntiTriche('Rédige moi une dissertation complète.');
    expect(result.allowed).toBe(false);
    expect(result.refusalMessage).toContain('triche');
    expect(result.guidanceMessage).toContain('plan');
  });
});

describe('buildRefusalOutput', () => {
  it('builds a structured refusal from classification result', () => {
    const classification = classifyAntiTriche('Écris moi un commentaire composé.');
    const output = buildRefusalOutput(classification);
    expect(output.blocked).toBe(true);
    expect(output.category).toBe('redaction_complete');
    expect(output.message).toBeTruthy();
    expect(output.guidance).toBeTruthy();
    expect(output.tip).toBeTruthy();
  });
});

describe('FORBIDDEN_PATTERNS', () => {
  it('has at least 5 patterns defined', () => {
    expect(FORBIDDEN_PATTERNS.length).toBeGreaterThanOrEqual(5);
  });

  it('all patterns have a category', () => {
    for (const { category } of FORBIDDEN_PATTERNS) {
      expect(category).toBeTruthy();
    }
  });
});
