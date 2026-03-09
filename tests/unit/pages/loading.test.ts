import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('loading skeletons', () => {
  const pages = [
    'src/app/loading.tsx',
    'src/app/atelier-oral/loading.tsx',
    'src/app/atelier-ecrit/loading.tsx',
    'src/app/tuteur/loading.tsx',
    'src/app/bibliotheque/loading.tsx',
  ];

  for (const page of pages) {
    it(`${page} existe`, () => {
      expect(existsSync(join(process.cwd(), page))).toBe(true);
    });
  }
});

describe('pages essentielles', () => {
  const essentials = [
    'src/app/not-found.tsx',
    'src/app/mentions-legales/page.tsx',
    'src/app/global-error.tsx',
  ];

  for (const page of essentials) {
    it(`${page} existe`, () => {
      expect(existsSync(join(process.cwd(), page))).toBe(true);
    });
  }
});
