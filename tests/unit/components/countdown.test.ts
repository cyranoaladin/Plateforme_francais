import { describe, expect, it } from 'vitest';
import { resolveDashboardCountdowns } from '@/lib/exam/exam-info';

describe('Countdown component', () => {
  it('lit les compte-à-rebours depuis la source officielle unique', () => {
    const countdowns = resolveDashboardCountdowns(
      {
        daysUntilExam: 77,
        examDate: '2026-06-08',
        oralDate: null,
        oralDaysUntil: null,
      },
      new Date('2026-03-23T00:00:00.000Z'),
    );

    expect(countdowns.countdownDays).toBe(77);
    expect(countdowns.countdownEcrit).toBe(77);
    expect(countdowns.countdownOral).toBeNull();
  });
});
