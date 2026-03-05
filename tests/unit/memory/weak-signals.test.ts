import { describe, expect, it } from 'vitest';
import { computeWeakSeverity, shouldCreateWeakSkill } from '@/lib/memory/scoring';

describe('weak signals', () => {
  it('calcule une sévérité critique sur fréquence forte', () => {
    expect(computeWeakSeverity(5, 1)).toBe('CRITICAL');
  });

  it('déclenche weak skill à partir de 3 occurrences', () => {
    expect(shouldCreateWeakSkill(3)).toBe(true);
    expect(shouldCreateWeakSkill(2)).toBe(false);
  });
});
