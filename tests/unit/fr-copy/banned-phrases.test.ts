import baseline from '../../../config/fr-copy-baseline.json';
import { describe, it } from 'vitest';

describe('FR Copy — Banned Phrases', () => {
  it('ne doit y avoir aucune banned-phrase dans le code', () => {
    const violations = Array.isArray(baseline.violations)
      ? baseline.violations.filter((item) => item.kind === 'banned-phrase')
      : [];

    if (violations.length > 0) {
      const details = violations
        .map((violation) => `  ${violation.file}:${violation.line} → "${violation.text}"`)
        .join('\n');
      throw new Error(`${violations.length} banned-phrase(s) détectée(s) :\n${details}`);
    }
  });
});
