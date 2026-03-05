import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('UploadCopie component', () => {
  it('atelier-écrit expose des inputs file sécurisés', () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-ecrit/page.tsx');
    const src = fs.readFileSync(file, 'utf8');
    expect(src).toContain('type="file"');
    expect(src).toContain('accept="image/jpeg,image/png,image/webp,application/pdf"');
  });
});
