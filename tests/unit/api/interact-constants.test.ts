import { describe, expect, it } from 'vitest';
import {
  INTERACTABLE_STATUSES,
  PHASE_TOKEN_COST,
} from '@/app/api/v1/oral/session/[sessionId]/interact/route';

describe('oral interact constants', () => {
  it('PHASE_TOKEN_COST totalise 2300 tokens', () => {
    const total = Object.values(PHASE_TOKEN_COST).reduce((sum, cost) => sum + cost, 0);
    expect(total).toBe(2300);
  });

  it('INTERACTABLE_STATUSES contient uniquement les statuts interactables', () => {
    expect(INTERACTABLE_STATUSES.has('DRAFT')).toBe(true);
    expect(INTERACTABLE_STATUSES.has('PASSAGE_RUNNING')).toBe(true);
    expect(INTERACTABLE_STATUSES.has('ENDED')).toBe(false);
  });
});
