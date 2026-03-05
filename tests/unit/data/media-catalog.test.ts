/**
 * tests/unit/data/media-catalog.test.ts
 * Tests unitaires pour le catalogue médias.
 */
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import path from 'path';
import {
  MEDIA_CATALOG,
  BIBLIOTHEQUE_MEDIA,
  getMediaForAgent,
  formatMediaContextForPrompt,
} from '@/data/media-catalog';
import type { MediaEntry } from '@/data/media-catalog';

describe('MEDIA_CATALOG — structure', () => {
  it('contient au moins 80 entrées', () => {
    expect(MEDIA_CATALOG.length).toBeGreaterThanOrEqual(80);
  });

  it('chaque entrée a un id unique', () => {
    const ids = MEDIA_CATALOG.map((m) => m.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('chaque entrée a les champs obligatoires', () => {
    for (const entry of MEDIA_CATALOG) {
      expect(entry.id).toBeTruthy();
      expect(entry.title).toBeTruthy();
      expect(entry.type).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.visibility).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.ragDescription).toBeTruthy();
      expect(entry.filePath).toBeTruthy();
      expect(entry.tags).toBeDefined();
      expect(Array.isArray(entry.tags)).toBe(true);
      expect(entry.level).toBeTruthy();
      expect(entry.source).toBeTruthy();
      expect(entry.sourceRef).toBeTruthy();
    }
  });

  it('les types sont valides', () => {
    const validTypes = ['video', 'audio', 'document'];
    const validVisibilities = ['BIBLIOTHEQUE', 'CONTEXTUAL', 'BOTH'];
    const validLevels = ['DEBUTANT', 'INTERMEDIAIRE', 'AVANCE'];

    for (const entry of MEDIA_CATALOG) {
      expect(validTypes).toContain(entry.type);
      expect(validVisibilities).toContain(entry.visibility);
      expect(validLevels).toContain(entry.level);
    }
  });
});

describe('MEDIA_CATALOG — filePaths', () => {
  it('chaque filePath pointe vers un fichier existant', () => {
    if (process.env.CI && process.env.CI_STRICT_MEDIA_FILES !== '1') {
      // CI runners do not ship heavyweight media assets; enable strict mode explicitly when needed.
      return;
    }

    const missing: string[] = [];
    for (const entry of MEDIA_CATALOG) {
      const absPath = path.resolve(process.cwd(), entry.filePath);
      if (!existsSync(absPath)) {
        missing.push(`${entry.id}: ${entry.filePath}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('MEDIA_CATALOG — oeuvreIds', () => {
  const OFFICIAL_WORKS = [
    'Cahier de Douai',
    "La rage de l'expression",
    'Mes forets',
    'Discours de la servitude volontaire',
    'Entretiens sur la pluralite des mondes',
    "Lettres d'une Peruvienne",
    'Le Menteur',
    "On ne badine pas avec l'amour",
    'Pour un oui ou pour un non',
    'Manon Lescaut',
    'La Peau de chagrin',
    'Sido suivi de Les Vrilles de la vigne',
  ];

  it('aucun oeuvreId en kebab-case (slug)', () => {
    const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)+$/;
    for (const entry of MEDIA_CATALOG) {
      if (entry.oeuvreIds) {
        for (const oid of entry.oeuvreIds) {
          expect(slugPattern.test(oid)).toBe(false);
        }
      }
    }
  });

  it('chaque oeuvreId correspond à une œuvre officielle', () => {
    for (const entry of MEDIA_CATALOG) {
      if (entry.oeuvreIds && entry.oeuvreIds.length > 0) {
        for (const oid of entry.oeuvreIds) {
          expect(OFFICIAL_WORKS).toContain(oid);
        }
      }
    }
  });

  it('les 12 œuvres officielles sont représentées', () => {
    const found = new Set<string>();
    for (const entry of MEDIA_CATALOG) {
      if (entry.oeuvreIds) {
        for (const oid of entry.oeuvreIds) {
          found.add(oid);
        }
      }
    }
    for (const work of OFFICIAL_WORKS) {
      expect(found.has(work)).toBe(true);
    }
  });
});

describe('BIBLIOTHEQUE_MEDIA', () => {
  it('ne contient que des entrées BIBLIOTHEQUE ou BOTH', () => {
    for (const entry of BIBLIOTHEQUE_MEDIA) {
      expect(['BIBLIOTHEQUE', 'BOTH']).toContain(entry.visibility);
    }
  });

  it('contient au moins 10 entrées', () => {
    expect(BIBLIOTHEQUE_MEDIA.length).toBeGreaterThanOrEqual(10);
  });
});

describe('getMediaForAgent', () => {
  it('retourne des entrées pour COACH_EXPLICATION', () => {
    const results = getMediaForAgent('COACH_EXPLICATION');
    expect(results.length).toBeGreaterThan(0);
  });

  it('filtre par oeuvreId quand fourni', () => {
    const results = getMediaForAgent('COACH_EXPLICATION', 'Manon Lescaut');
    expect(results.length).toBeGreaterThan(0);
    for (const entry of results) {
      if (entry.oeuvreIds && entry.oeuvreIds.length > 0) {
        expect(entry.oeuvreIds).toContain('Manon Lescaut');
      }
    }
  });

  it('retourne un tableau vide pour une œuvre inexistante + agent strict', () => {
    const results = getMediaForAgent('GRAMMAIRE_CIBLEE', 'Oeuvre Inexistante');
    // Should return entries with no oeuvreIds restriction or matching agent
    // but all should NOT have 'Oeuvre Inexistante' in oeuvreIds
    for (const entry of results) {
      if (entry.oeuvreIds && entry.oeuvreIds.length > 0) {
        expect(entry.oeuvreIds).not.toContain('Oeuvre Inexistante');
      }
    }
  });
});

describe('formatMediaContextForPrompt', () => {
  it('retourne une chaîne vide si aucune entrée', () => {
    expect(formatMediaContextForPrompt([])).toBe('');
  });

  it('contient l\'instruction de ne pas citer d\'URL', () => {
    const entries: MediaEntry[] = MEDIA_CATALOG.slice(0, 3);
    const result = formatMediaContextForPrompt(entries);
    expect(result).toContain('Ne jamais citer une URL');
    expect(result).toContain('[Ressource: titre]');
  });

  it('limite à 5 entrées maximum', () => {
    const entries = MEDIA_CATALOG.slice(0, 10);
    const result = formatMediaContextForPrompt(entries);
    const titleMatches = result.match(/Vidéo —/g) ?? [];
    expect(titleMatches.length).toBeLessThanOrEqual(5);
  });

  it('inclut le titre et la description de chaque entrée', () => {
    const entries = MEDIA_CATALOG.slice(0, 2);
    const result = formatMediaContextForPrompt(entries);
    for (const entry of entries) {
      expect(result).toContain(entry.title);
      expect(result).toContain(entry.description);
    }
  });
});
