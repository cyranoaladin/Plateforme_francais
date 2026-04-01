import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Atelier oral page structure', () => {
  it('compose la page a partir du hook useOralSession et des sous-composants extraits', () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-oral/page.tsx');
    const src = fs.readFileSync(file, 'utf8');
    const hookFile = path.resolve(process.cwd(), 'src/app/atelier-oral/hooks/useOralSession.ts');
    const hookSrc = fs.readFileSync(hookFile, 'utf8');

    expect(src).toContain("from './hooks/useOralSession'");
    expect(src).toContain("from './components/OralPassagePhase'");
    expect(src).toContain("from './components/OralResultsPanel'");
    expect(src).toContain('<OralPrepPhase');
    expect(src).toContain('<OralPassagePhase');
    expect(src).toContain('<OralResultsPanel');
    expect(hookSrc).toContain("from './useCountdown'");
  });
});
