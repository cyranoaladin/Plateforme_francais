import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function collectApiFiles(dir: string, acc: string[]): void {
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      collectApiFiles(absolute, acc);
      continue;
    }
    if (absolute.endsWith('.ts') || absolute.endsWith('.tsx')) {
      acc.push(absolute);
    }
  }
}

describe('API routes logger usage', () => {
  it('does not leave console.* statements inside src/app/api', () => {
    const apiRoot = path.resolve(process.cwd(), 'src/app/api');
    const files: string[] = [];
    collectApiFiles(apiRoot, files);

    const offenders = files.filter((file) => /console\.(error|warn|log|info)/.test(readFileSync(file, 'utf8')));

    expect(offenders).toEqual([]);
  });
});
