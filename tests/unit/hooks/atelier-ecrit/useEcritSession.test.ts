import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useEcritSession structure', () => {
  it('orchestre upload et suivi de correction via des hooks dédiés', () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-ecrit/hooks/useEcritSession.ts');
    const src = fs.readFileSync(file, 'utf8');

    expect(src).toContain("from './useEcritUpload'");
    expect(src).toContain("from './useEcritCorrection'");
    expect(src).toContain('const upload = useEcritUpload(');
    expect(src).toContain('const correction = useEcritCorrection(');
  });
});
