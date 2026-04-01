import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Written workshop upload progress', () => {
  it('uses EventSource on the persisted progress stream endpoint after upload', () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-ecrit/hooks/useEcritCorrection.ts');
    const src = fs.readFileSync(file, 'utf8');

    expect(src).toContain('watchCorrectionProgress');
    expect(src).toContain('new EventSource(`/api/v1/epreuves/copies/${inputLink.copieId}/events`)');
    expect(src).toContain('eventSourceRef.current.addEventListener(\'progress\'');
  });

  it('keeps a polling fallback when EventSource is unavailable or errors', () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-ecrit/hooks/useEcritCorrection.ts');
    const src = fs.readFileSync(file, 'utf8');

    expect(src).toContain("typeof window === 'undefined' || typeof window.EventSource === 'undefined'");
    expect(src).toContain('pollCorrection(inputLink);');
    expect(src).toContain('eventSourceRef.current.onerror = () => {');
  });
});
