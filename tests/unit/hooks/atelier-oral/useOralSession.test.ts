import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useOralSession structure', () => {
  it('orchestre les hooks spécialisés sans casser le contrat public', () => {
    const file = path.resolve(process.cwd(), 'src/app/atelier-oral/hooks/useOralSession.ts');
    const src = fs.readFileSync(file, 'utf8');

    expect(src).toContain("from './useOralApi'");
    expect(src).toContain("from './useOralQuota'");
    expect(src).toContain('const api = useOralApi(');
    expect(src).toContain('const quota = useOralQuota()');
    expect(src).toContain('startSession');
    expect(src).toContain('submitStep');
    expect(src).toContain('askExaminerFollowUp');
  });
});
