import { describe, expect, it } from 'vitest';

import { computeCountdownDays, resolveDashboardCountdowns } from '@/lib/exam/exam-info';

describe('exam info helpers', () => {
  it('returns null for missing or invalid dates', () => {
    expect(computeCountdownDays(null)).toBeNull();
    expect(computeCountdownDays(undefined)).toBeNull();
    expect(computeCountdownDays('not-a-date')).toBeNull();
  });

  it('computes written and oral countdowns from the official source', () => {
    const countdowns = resolveDashboardCountdowns(
      {
        daysUntilExam: 77,
        examDate: '2026-06-08',
        oralDate: '2026-06-19',
        oralDaysUntil: 88,
      },
      new Date('2026-03-23T00:00:00.000Z'),
    );

    expect(countdowns.countdownDays).toBe(77);
    expect(countdowns.countdownEcrit).toBe(77);
    expect(countdowns.countdownOral).toBe(88);
  });

  it('keeps the oral countdown empty when the official oral date is not planned yet', () => {
    const countdowns = resolveDashboardCountdowns(
      {
        daysUntilExam: 77,
        examDate: '2026-06-08',
        oralDate: null,
        oralDaysUntil: null,
      },
      new Date('2026-03-23T00:00:00.000Z'),
    );

    expect(countdowns.countdownEcrit).toBe(77);
    expect(countdowns.countdownOral).toBeNull();
  });
});
