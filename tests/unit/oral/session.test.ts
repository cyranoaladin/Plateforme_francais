import { describe, expect, it } from 'vitest';
import { canTransition, transition } from '@/lib/oral/state-machine';

describe('Oral session lifecycle', () => {
  it('autorise la séquence officielle', () => {
    expect(canTransition('DRAFT', 'PREP_RUNNING')).toBe(true);
    expect(canTransition('PREP_RUNNING', 'PREP_ENDED')).toBe(true);
    expect(canTransition('PREP_ENDED', 'PASSAGE_RUNNING')).toBe(true);
    expect(canTransition('PASSAGE_RUNNING', 'PASSAGE_DONE')).toBe(true);
    expect(canTransition('PASSAGE_DONE', 'FINALIZED')).toBe(true);
  });

  it('rejette une transition invalide', () => {
    expect(() => transition('DRAFT', 'PASSAGE_RUNNING')).toThrow();
  });
});
