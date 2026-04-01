import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('fr-copy workflow shell guard', () => {
  it('garde des quotes shell valides autour de VIOLATIONS et github context', () => {
    const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/ci-cd.yml'), 'utf8');

    expect(workflow).toContain('name: Contrôle copy FR — zero banned-phrases');
    expect(workflow).toContain('if [ "$VIOLATIONS" -gt "0" ]; then');
    expect(workflow).toContain('echo "❌ $VIOLATIONS banned-phrase(s) détectée(s) dans le code :"');
    expect(workflow).toContain('if [ "${{ github.event_name }}" = "push" ]');
    expect(workflow).toContain('echo "::warning::FR baseline changed but auto-push disabled (PR context)"');
    expect(workflow).not.toContain('name: Contrôle FR (baseline copy)');
    expect(workflow).not.toContain('if [ \\"$VIOLATIONS\\" -gt \\"0\\" ]; then');
    expect(workflow).not.toContain('echo \\"❌ $VIOLATIONS');
  });
});
