import { describe, expect, it } from 'vitest';
import type { ExamInfoPayload } from '@/lib/exam/exam-info';

describe('use-dashboard hook', () => {
  const officialExamInfo: ExamInfoPayload = {
    daysUntilExam: 77,
    examDate: '2026-06-08',
    examDayLabel: 'Lundi 8 juin 2026',
    phase: 'fondations',
    phaseLabel: 'Phase Fondations',
    phaseAction: 'Priorité : mini-séances quotidiennes.',
    coefficient: 5,
    simulations: [],
    oralDate: null,
    oralDateStatus: 'a_planifier',
    oralDateNote: 'Date orale à confirmer.',
    oralDaysUntil: null,
  };

  it('exporte useDashboard et computeDashboardMetricsFromTimeline', async () => {
    const mod = await import('@/hooks/useDashboard');
    expect(typeof mod.useDashboard).toBe('function');
    expect(typeof mod.computeDashboardMetricsFromTimeline).toBe('function');
  });

  it('returns no score placeholders when no evaluation exists', async () => {
    const { computeDashboardMetricsFromTimeline } = await import('@/hooks/useDashboard');

    const metrics = computeDashboardMetricsFromTimeline({
      profile: {
        displayName: 'Élève test',
        onboardingCompleted: false,
      },
      timeline: [],
      weakSignals: {},
      examInfo: officialExamInfo,
    });

    expect(metrics.hasEvaluationData).toBe(false);
    expect(metrics.scores).toEqual({
      oral: null,
      ecrit: null,
      grammaire: null,
      lectureCursive: null,
    });
    expect(metrics.weeklyProgression).toEqual([]);
    expect(metrics.countdownDays).toBe(77);
    expect(metrics.countdownEcrit).toBe(77);
    expect(metrics.countdownOral).toBeNull();
  });

  it('computes scores from evaluation events when data exists', async () => {
    const { computeDashboardMetricsFromTimeline } = await import('@/hooks/useDashboard');

    const metrics = computeDashboardMetricsFromTimeline({
      profile: {
        displayName: 'Élève test',
        onboardingCompleted: true,
      },
      timeline: [
        {
          id: '1',
          userId: 'u1',
          type: 'evaluation',
          feature: 'atelier_oral',
          payload: { score: 14, max: 20 },
          createdAt: '2026-03-20T10:00:00.000Z',
        },
        {
          id: '2',
          userId: 'u1',
          type: 'evaluation',
          feature: 'atelier_langue',
          payload: { score: 1, max: 2, weakSkills: ['grammaire'] },
          createdAt: '2026-03-21T10:00:00.000Z',
        },
      ],
      weakSignals: { grammaire: 1 },
      examInfo: officialExamInfo,
    });

    expect(metrics.hasEvaluationData).toBe(true);
    expect(metrics.scores.oral).toBe(14);
    expect(metrics.scores.grammaire).toBe(10);
    expect(metrics.scores.ecrit).toBeNull();
    expect(metrics.scores.lectureCursive).toBeNull();
    expect(metrics.weeklyProgression).toHaveLength(1);
    expect(metrics.countdownEcrit).toBe(77);
  });

  it('prefers official exam info over profile-specific dates for countdowns', async () => {
    const { computeDashboardMetricsFromTimeline } = await import('@/hooks/useDashboard');

    const metrics = computeDashboardMetricsFromTimeline({
      profile: {
        displayName: 'Élève test',
        onboardingCompleted: true,
        eafDate: '2026-07-15',
      },
      timeline: [],
      weakSignals: {},
      examInfo: {
        ...officialExamInfo,
        daysUntilExam: 42,
      },
    });

    expect(metrics.eafDate).toBe('2026-07-15');
    expect(metrics.countdownDays).toBe(42);
    expect(metrics.countdownEcrit).toBe(42);
  });
});
