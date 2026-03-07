import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('parcours recommender', () => {
  it('mappe les signaux faibles vers les bons ateliers', () => {
    const file = path.resolve(process.cwd(), 'src/components/dashboard/parcours-recommandation.tsx');
    const src = fs.readFileSync(file, 'utf8');
    expect(src).toContain("'Retendre la problématique'");
    expect(src).toContain("href: '/atelier-ecrit'");
    expect(src).toContain("'Relancer une explication linéaire'");
    expect(src).toContain("href: '/atelier-oral'");
  });
});
