import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('OralSimulator component', () => {
  it('gère les étapes officielles + mode examinateur dialoguant', () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-oral/page.tsx');
    const src = fs.readFileSync(file, 'utf8');
    expect(src).toContain("LECTURE");
    expect(src).toContain("EXPLICATION");
    expect(src).toContain("GRAMMAIRE");
    expect(src).toContain("ENTRETIEN");
    expect(src).toContain('/api/v1/oral/jury-respond');
    expect(src).toContain('examinerProfile');
    expect(src).toContain('conversationHistory');
    expect(src).toContain("L'entretien officiel commence.");
    expect(src).toContain('/api/v1/oral/session/${session.sessionId}/end');
  });
});
