import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readProjectFile(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

describe('dark navy hero contrast guard', () => {
  const darkHeroFiles = [
    'src/app/dashboard/page.tsx',
    'src/app/mon-parcours/page.tsx',
    'src/app/profil/page.tsx',
    'src/app/descriptif-lecture/page.tsx',
    'src/app/atelier-ecrit/page.tsx',
    'src/app/atelier-langue/page.tsx',
    'src/app/bibliotheque/page.tsx',
    'src/app/carnet/page.tsx',
    'src/app/quiz/page.tsx',
    'src/app/tuteur/page.tsx',
    'src/components/atelier-oral/OralHero.tsx',
  ];

  it('exposes explicit WCAG text utilities for dark navy sections', () => {
    const css = readProjectFile('src/app/globals.css');

    expect(css).toContain('.text-on-dark-h1');
    expect(css).toContain('color: #FFFFFF !important;');
    expect(css).toContain('.text-on-dark-body');
    expect(css).toContain('color: rgba(255, 255, 255, 0.72) !important;');
    expect(css).toContain('.text-on-dark-label');
    expect(css).toContain('.text-on-dark-muted');
    expect(css).toContain('.btn-ghost-dark');
    expect(css).toContain('.stat-card-dark');
  });

  it('documents that light-mode text tokens are forbidden on dark navy backgrounds', () => {
    const guidelines = readProjectFile('docs/FRONTEND_GUIDELINES.md');

    expect(guidelines).toContain('## Couleurs de texte selon le fond');
    expect(guidelines).toContain('### FOND DARK-NAVY');
    expect(guidelines).toContain('### JAMAIS sur fond dark');
    expect(guidelines).toContain('var(--eaf-text-primary)');
    expect(guidelines).toContain('--eaf-orange = CTAs et alertes UNIQUEMENT');
  });

  it('uses explicit dark contrast utilities in student dark navy heroes', () => {
    for (const file of darkHeroFiles) {
      const source = readProjectFile(file);

      expect(source, file).toContain('#0d1a35');
      expect(source, file).toContain('text-on-dark-h1');
      expect(source, file).toContain('text-on-dark-body');
    }
  });

  it('keeps dashboard hero chips on translucent dark backgrounds', () => {
    const source = readProjectFile('src/app/dashboard/page.tsx');
    const heroStart = source.indexOf('Pilotage du jour');
    const heroStatsEnd = source.indexOf('Right column: CE QUE FAIRE MAINTENANT');
    const heroHeaderAndMeta = source.slice(heroStart, heroStatsEnd);

    expect(heroHeaderAndMeta).toContain('Lundi 8 juin 2026');
    expect(heroHeaderAndMeta).toContain('Oral : {data.countdownOral');
    expect(heroHeaderAndMeta).toContain('Angle à reprendre');
    expect(heroHeaderAndMeta).toContain("background: 'rgba(255,255,255,0.06)'");
    expect(heroHeaderAndMeta).not.toContain("background: 'var(--eaf-bg2)'");
    expect(heroHeaderAndMeta).not.toContain("background: 'var(--eaf-bg3)'");
  });
});
