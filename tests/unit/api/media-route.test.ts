/**
 * tests/unit/api/media-route.test.ts
 * Tests unitaires pour la sécurité et la logique de la route API media.
 */
import { describe, it, expect } from 'vitest';
import path from 'path';
import { MEDIA_CATALOG } from '@/data/media-catalog';
import { getRessourcesRoot, isWithinRessourcesRoot, resolveCatalogFilePath, resolveRessourcePath } from '@/lib/ressources/path';

describe('Media API Route — catalog integrity', () => {
  it('chaque id du catalogue est un slug sûr (pas de path traversal)', () => {
    for (const entry of MEDIA_CATALOG) {
      expect(entry.id).not.toContain('..');
      expect(entry.id).not.toContain('/');
      expect(entry.id).not.toContain('\\');
      expect(entry.id).not.toContain('\0');
    }
  });

  it('chaque filePath reste dans ressources/', () => {
    const ressourcesRoot = path.resolve(getRessourcesRoot()) + path.sep;
    for (const entry of MEDIA_CATALOG) {
      const absPath = resolveCatalogFilePath(entry.filePath);
      expect(absPath.startsWith(ressourcesRoot)).toBe(true);
    }
  });

  it('aucun filePath ne contient de séquence de path traversal (../ ou ..\\)', () => {
    for (const entry of MEDIA_CATALOG) {
      expect(entry.filePath).not.toMatch(/\.\.[/\\]/);
      expect(entry.filePath).not.toMatch(/[/\\]\.\./);
    }
  });
});

describe('Media API Route — path traversal protection logic', () => {
  it('un chemin avec .. serait détecté par startsWith', () => {
    const ressourcesRoot = path.resolve(getRessourcesRoot()) + path.sep;
    const maliciousPath = path.resolve(getRessourcesRoot(), '../etc/passwd');
    expect(maliciousPath.startsWith(ressourcesRoot)).toBe(false);
    expect(isWithinRessourcesRoot(maliciousPath)).toBe(false);
  });

  it('un chemin vers un répertoire frère est bloqué', () => {
    const ressourcesRoot = path.resolve(getRessourcesRoot()) + path.sep;
    const siblingPath = path.resolve(process.cwd(), 'src/data/media-catalog.ts');
    expect(siblingPath.startsWith(ressourcesRoot)).toBe(false);
    expect(isWithinRessourcesRoot(siblingPath)).toBe(false);
  });

  it('un chemin qui commence par ressources- (sans /) est bloqué', () => {
    const ressourcesRoot = path.resolve(getRessourcesRoot()) + path.sep;
    const trickPath = path.resolve(process.cwd(), 'ressources-evil/malicious.mp4');
    expect(trickPath.startsWith(ressourcesRoot)).toBe(false);
    expect(isWithinRessourcesRoot(trickPath)).toBe(false);
  });

  it('un chemin légitime dans ressources/Videos est accepté', () => {
    const ressourcesRoot = path.resolve(getRessourcesRoot()) + path.sep;
    const legitimatePath = resolveRessourcePath('Videos/test.mp4');
    expect(legitimatePath.startsWith(ressourcesRoot)).toBe(true);
    expect(isWithinRessourcesRoot(legitimatePath)).toBe(true);
  });
});

describe('Media API Route — MIME types', () => {
  const MIME_TYPES: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.pdf': 'application/pdf',
  };

  it('chaque fichier du catalogue a une extension reconnue', () => {
    const validExtensions = Object.keys(MIME_TYPES);
    for (const entry of MEDIA_CATALOG) {
      const ext = path.extname(entry.filePath).toLowerCase();
      expect(validExtensions).toContain(ext);
    }
  });
});

describe('Media API Route — id uniqueness and format', () => {
  it('tous les ids sont uniques', () => {
    const ids = MEDIA_CATALOG.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tous les ids sont en kebab-case valide', () => {
    const kebabPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const entry of MEDIA_CATALOG) {
      expect(kebabPattern.test(entry.id)).toBe(true);
    }
  });
});
