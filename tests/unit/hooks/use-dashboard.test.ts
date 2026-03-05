import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('use-dashboard hook', () => {
  it('exporte useDashboard et interroge la timeline API', async () => {
    const mod = await import('@/hooks/useDashboard');
    expect(typeof mod.useDashboard).toBe('function');

    const file = path.resolve(process.cwd(), 'src/hooks/useDashboard.ts');
    const src = fs.readFileSync(file, 'utf8');
    expect(src).toContain('/api/v1/memory/timeline?limit=200');
    expect(src).toContain('countdownEcrit');
    expect(src).toContain('countdownOral');
  });
});
