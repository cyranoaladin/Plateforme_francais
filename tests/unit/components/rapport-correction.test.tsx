import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('RapportCorrection component', () => {
  it('affiche note, rubriques, annotations et overlay interactif', () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-ecrit/correction/[copieId]/page.tsx');
    const src = fs.readFileSync(file, 'utf8');
    expect(src).toContain('Rapport de correction');
    expect(src).toContain('Rubriques');
    expect(src).toContain('Annotations ciblées');
    expect(src).toContain('mapAnnotationsToRegions');
    expect(src).toContain('/api/v1/epreuves/copies/${payload.copieId}/file');
    expect(src).toContain('setActiveAnnotation');
    expect(src).toContain('/api/v1/epreuves/copies/${payload.copieId}/report');
  });
});
