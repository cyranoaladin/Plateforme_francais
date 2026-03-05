import { describe, expect, it } from 'vitest';
import { PREP_DURATION_MS, PASSAGE_DURATION_MS, remainingTimeMs } from '@/lib/oral/state-machine';

describe('Oral chrono', () => {
  it('préparation 30 min', () => {
    expect(PREP_DURATION_MS).toBe(30 * 60 * 1000);
  });

  it('passage 20 min', () => {
    expect(PASSAGE_DURATION_MS).toBe(20 * 60 * 1000);
  });

  it('retourne 0 si phase expirée', () => {
    const started = new Date(Date.now() - PREP_DURATION_MS - 1_000);
    expect(remainingTimeMs('PREP_RUNNING', started)).toBe(0);
  });
});
