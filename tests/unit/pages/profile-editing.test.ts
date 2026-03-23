import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('profil page editing', () => {
  it('exposes editable fields and saves through the student profile API', () => {
    const file = path.resolve(process.cwd(), 'src/app/profil/page.tsx');
    const src = fs.readFileSync(file, 'utf8');

    expect(src).toContain("method: 'PUT'");
    expect(src).toContain('/api/v1/student/profile');
    expect(src).toContain('Nom affiché');
    expect(src).toContain('Classe');
    expect(src).toContain('E-mail parent');
    expect(src).toContain('E-mail enseignant');
  });
});
