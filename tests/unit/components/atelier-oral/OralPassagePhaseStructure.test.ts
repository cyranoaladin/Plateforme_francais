import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('OralPassagePhase structure', () => {
  it('compose le passage à partir des sous-composants extraits', () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-oral/components/OralPassagePhase.tsx');
    const src = fs.readFileSync(file, 'utf8');

    expect(src).toContain("from './passage/PassageTimer'");
    expect(src).toContain("from './passage/PassageContext'");
    expect(src).toContain("from './passage/PassageInput'");
    expect(src).toContain("from './passage/PassageSubmitBar'");
    expect(src).toContain("from './passage/PassageFeedback'");
    expect(src).toContain("from './passage/PassagePrincipe'");
  });
});
