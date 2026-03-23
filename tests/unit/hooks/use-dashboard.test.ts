import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('use-dashboard hook', () => {
  it('exporte useDashboard et interroge la timeline API', async () => {
    const mod = await import('@/hooks/useDashboard');
    expect(typeof mod.useDashboard).toBe('function');
    expect(typeof mod.computeDashboardMetricsFromTimeline).toBe('function');

    const file = path.resolve(process.cwd(), 'src/hooks/useDashboard.ts');
    const src = fs.readFileSync(file, 'utf8');
    expect(src).toContain('/api/v1/memory/timeline?limit=200');
    expect(src).toContain('countdownEcrit');
    expect(src).toContain('countdownOral');
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
    });

    expect(metrics.hasEvaluationData).toBe(false);
    expect(metrics.scores).toEqual({
      oral: null,
      ecrit: null,
      grammaire: null,
      lectureCursive: null,
    });
    expect(metrics.weeklyProgression).toEqual([]);
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
    });

    expect(metrics.hasEvaluationData).toBe(true);
    expect(metrics.scores.oral).toBe(14);
    expect(metrics.scores.grammaire).toBe(10);
    expect(metrics.scores.ecrit).toBeNull();
    expect(metrics.scores.lectureCursive).toBeNull();
    expect(metrics.weeklyProgression).toHaveLength(1);
  });
});
