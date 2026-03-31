import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('OralSimulator source', () => {
  it("initialise l'entretien avec une première question d'examinateur", () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-oral/page.tsx');
    const src = fs.readFileSync(file, 'utf8');
    expect(src).toContain("L'entretien officiel commence.");
    expect(src).toContain('/api/v1/oral/jury-respond');
    expect(src).toContain('conversationHistory');
    expect(src).toContain('includeStudentTurn: false');
  });
});
