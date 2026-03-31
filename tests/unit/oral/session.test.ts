import { describe, expect, it } from 'vitest';
import { canTransition, transition, PHASE_DURATIONS_S } from '@/lib/oral/state-machine';

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

  it('expose les durées officielles des 4 phases orales', () => {
    expect(PHASE_DURATIONS_S.LECTURE).toBe(120);
    expect(PHASE_DURATIONS_S.EXPLICATION).toBe(480);
    expect(PHASE_DURATIONS_S.GRAMMAIRE).toBe(120);
    expect(PHASE_DURATIONS_S.ENTRETIEN).toBe(480);
  });
});
