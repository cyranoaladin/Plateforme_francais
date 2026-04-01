import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Correction progress stream page', () => {
  it('uses EventSource on the persisted progress stream endpoint', () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-ecrit/correction/[copieId]/page.tsx');
    const src = fs.readFileSync(file, 'utf8');

    expect(src).toContain('new EventSource(');
    expect(src).toContain('/api/v1/epreuves/copies/${params.copieId}/events');
  });

  it('keeps a polling fallback when EventSource is unavailable', () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-ecrit/correction/[copieId]/page.tsx');
    const src = fs.readFileSync(file, 'utf8');

    expect(src).toContain("typeof window === 'undefined' || typeof window.EventSource === 'undefined'");
    expect(src).toContain('void loadStatusSnapshot(true)');
    expect(src).toContain("setTimeout(() => {\n          void loadStatusSnapshot(true);\n        }, 3000)");
  });
});
