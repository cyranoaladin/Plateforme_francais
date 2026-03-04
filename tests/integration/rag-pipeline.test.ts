import { describe, it, expect, vi } from 'vitest';

vi.mock('pino', () => {
  const noop = () => {};
  const mock = { info: noop, warn: noop, error: noop, debug: noop, child: () => mock };
  return { default: () => mock };
});

vi.mock('@prisma/client', () => ({
  PrismaClient: class { $queryRaw = async () => []; },
}));

import { searchOfficialReferences, formatRagContextForPrompt } from '@/lib/rag/search';
import { toCitations, citationSchema } from '@/lib/rag/citations';

describe('RAG Pipeline integration', () => {
  describe('searchOfficialReferences (lexical)', () => {
    it('retourne des résultats pour "Baudelaire"', async () => {
      const results = await searchOfficialReferences('Baudelaire', 5);
      expect(Array.isArray(results)).toBe(true);
    });

    it('retourne un tableau vide pour une requête sans match', async () => {
      const results = await searchOfficialReferences('xyzzyquux123456', 5);
      expect(results.length).toBe(0);
    });

    it('retourne au plus maxResults éléments', async () => {
      const results = await searchOfficialReferences('poésie', 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('chaque résultat a les champs requis', async () => {
      const results = await searchOfficialReferences('commentaire', 3);
      for (const r of results) {
        expect(r).toHaveProperty('id');
        expect(r).toHaveProperty('title');
        expect(r).toHaveProperty('type');
        expect(r).toHaveProperty('excerpt');
        expect(r).toHaveProperty('score');
      }
    });
  });

  describe('formatRagContextForPrompt', () => {
    it('retourne une chaîne vide pour 0 résultats', () => {
      expect(formatRagContextForPrompt([])).toBe('');
    });

    it('formate des résultats avec titre et excerpt', () => {
      const results = [
        {
          id: 'doc1', title: 'Rapport jury 2024', type: 'rapport_jury' as const,
          level: 'B' as const, excerpt: 'Les procédés stylistiques...', url: '',
          score: 0.9, sourceRef: 'Rapport jury EAF 2024',
        },
      ];
      const formatted = formatRagContextForPrompt(results);
      expect(formatted).toContain('Rapport jury 2024');
      expect(formatted).toContain('Les procédés stylistiques...');
    });
  });

  describe('toCitations (BUG-CRIT-01 regression)', () => {
    it('produit des citations avec source_interne, jamais url', () => {
      const fakeResults = [
        {
          id: 'doc1', title: 'Test', type: 'texte_officiel' as const,
          level: 'A' as const, excerpt: 'Extrait test.',
          url: 'https://internal.example.com/doc',
          score: 0.9, sourceRef: 'BO 2025 Annexe 3',
        },
      ];
      const citations = toCitations(fakeResults);
      expect(citations.length).toBe(1);
      expect(citations[0]).toHaveProperty('source_interne');
      expect(citations[0]).not.toHaveProperty('url');
      expect(citations[0].source_interne).toBe('BO 2025 Annexe 3');
    });

    it('utilise le fallback type — title quand sourceRef absent', () => {
      const fakeResults = [
        {
          id: 'doc2', title: 'Rapport jury 2023', type: 'rapport_jury' as const,
          level: 'B' as const, excerpt: 'Snippet.',
          url: '', score: 0.8,
        },
      ];
      const citations = toCitations(fakeResults);
      expect(citations[0].source_interne).toBe('rapport_jury — Rapport jury 2023');
    });

    it('tronque les snippets > 240 chars', () => {
      const longExcerpt = 'a'.repeat(300);
      const fakeResults = [
        {
          id: 'doc3', title: 'Long', type: 'texte_officiel' as const,
          level: 'A' as const, excerpt: longExcerpt,
          url: '', score: 0.5, sourceRef: 'Source',
        },
      ];
      const citations = toCitations(fakeResults);
      expect(citations[0].snippet.length).toBeLessThanOrEqual(240);
      expect(citations[0].snippet.endsWith('...')).toBe(true);
    });

    it('le schéma Zod valide une citation correcte', () => {
      const good = { title: 'Test', source_interne: 'BO 2025', snippet: 'Court.' };
      expect(citationSchema.safeParse(good).success).toBe(true);
    });

    it('le schéma Zod rejette une citation avec url au lieu de source_interne', () => {
      const bad = { title: 'Test', url: 'https://example.com', snippet: 'Court.' };
      expect(citationSchema.safeParse(bad).success).toBe(false);
    });
  });
});
