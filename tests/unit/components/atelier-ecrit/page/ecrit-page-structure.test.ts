import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Atelier écrit page structure', () => {
  it('compose la page à partir de hooks et composants extraits', () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-ecrit/page.tsx');
    const src = fs.readFileSync(file, 'utf8');

    expect(src).toContain("from './hooks/useEcritSession'");
    expect(src).toContain("from './components/EcritEpreuveSelector'");
    expect(src).toContain("from './components/EcritCopyUploader'");
    expect(src).toContain("from './components/EcritCorrectionProgress'");
  });
});
