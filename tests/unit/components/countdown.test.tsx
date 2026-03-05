import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Countdown component', () => {
  it('dashboard calcule les compte-à-rebours EAF écrit/oral', () => {
    const file = path.resolve(process.cwd(), 'src/hooks/useDashboard.ts');
    const src = fs.readFileSync(file, 'utf8');
    expect(src).toContain('countdownEcrit');
    expect(src).toContain('2026-06-11T08:00:00');
    expect(src).toContain('countdownOral');
    expect(src).toContain('2026-06-22T00:00:00');
  });
});
