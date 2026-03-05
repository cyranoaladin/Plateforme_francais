import { describe, expect, it } from 'vitest';
import { canTransition, remainingTimeMs } from '@/lib/oral/state-machine';

describe('DB oral-session', () => {
  it('workflow oral valide + timer cohérent', () => {
    expect(canTransition('PREP_ENDED', 'PASSAGE_RUNNING')).toBe(true);
    const started = new Date(Date.now() - 60_000);
    expect(remainingTimeMs('PASSAGE_RUNNING', started)).toBeGreaterThan(0);
  });
});
