import { describe, expect, it } from 'vitest';

import { buildProfileScoreSummary } from '@/lib/profile/profile-score-summary';

describe('buildProfileScoreSummary', () => {
  it('returns an empty-state summary when no evaluation exists', () => {
    expect(buildProfileScoreSummary([])).toEqual({
      hasEvaluationData: false,
      skillMap: {
        ecrit: null,
        oral: null,
        grammaire: null,
        lectureCursive: null,
        lastUpdated: null,
      },
    });
  });

  it('maps a real average to the four profile axes', () => {
    expect(buildProfileScoreSummary([12, 14], '2026-03-23T00:00:00.000Z')).toEqual({
      hasEvaluationData: true,
      skillMap: {
        ecrit: 13,
        oral: 13.4,
        grammaire: 12.8,
        lectureCursive: 13.1,
        lastUpdated: '2026-03-23T00:00:00.000Z',
      },
    });
  });
});
