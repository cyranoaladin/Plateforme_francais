'use client';

import { useEffect, useMemo, useState } from 'react';

type MemoryEvent = {
  id: string;
  userId: string;
  type: string;
  feature: string;
  path?: string;
  payload?: Record<string, string | number | boolean | string[]>;
  createdAt: string;
};

type TimelineResponse = {
  profile: {
    displayName: string;
    onboardingCompleted: boolean;
    eafDate?: string;
  };
  timeline: MemoryEvent[];
  weakSignals: Record<string, number>;
};

type SkillScores = {
  oral: number;
  ecrit: number;
  grammaire: number;
  lectureCursive: number;
};

export type DashboardMetrics = {
  scores: SkillScores;
  weakSignals: Record<string, number>;
  lastActivity: string | null;
  totalSessions: number;
  streak: number;
  weeklyProgression: Array<{ week: string; score: number }>;
  timeline: MemoryEvent[];
  displayName: string;
  onboardingCompleted: boolean;
  eafDate: string | null;
  countdownDays: number | null;
  isLoading: boolean;
  error: string | null;
};

const DEFAULT_SCORES: SkillScores = {
  oral: 10,
  ecrit: 10,
  grammaire: 10,
  lectureCursive: 10,
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(20, Number(value.toFixed(1))));
}

function weekKey(date: Date): string {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((copy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${copy.getUTCFullYear()}-S${String(weekNo).padStart(2, '0')}`;
}

function eventToScore(event: MemoryEvent): number | null {
  const score = event.payload?.score;
  const max = event.payload?.max;

  if (typeof score === 'number' && typeof max === 'number' && max > 0) {
    return clampScore((score / max) * 20);
  }

  if (typeof score === 'number') {
    return clampScore(score <= 2 ? score * 10 : score);
  }

  return null;
}

function resolveSkill(event: MemoryEvent): keyof SkillScores {
  const text = `${event.feature} ${event.path ?? ''}`.toLowerCase();
  const weakSkills = Array.isArray(event.payload?.weakSkills)
    ? event.payload?.weakSkills.join(' ').toLowerCase()
    : '';

  if (text.includes('oral')) return 'oral';
  if (text.includes('langue') || weakSkills.includes('grammaire')) return 'grammaire';
  if (text.includes('lecture') || weakSkills.includes('lecture cursive')) return 'lectureCursive';
  return 'ecrit';
}

function computeStreak(events: MemoryEvent[]): number {
  const daySet = new Set(
    events.map((event) => {
      const date = new Date(event.createdAt);
      return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
    }),
  );

  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
    if (!daySet.has(key)) {
      if (streak === 0) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        const prevKey = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
        if (!daySet.has(prevKey)) {
          return 0;
        }
      } else {
        break;
      }
    }

    if (daySet.has(key)) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }

    break;
  }

  return streak;
}

export function useDashboard(): DashboardMetrics {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/v1/memory/timeline?limit=200');
        if (!response.ok) {
          throw new Error('Impossible de charger la timeline.');
        }

        const payload = (await response.json()) as TimelineResponse;
        setData(payload);
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return useMemo(() => {
    const timeline = data?.timeline ?? [];

    const scoreBuckets: Record<keyof SkillScores, number[]> = {
      oral: [],
      ecrit: [],
      grammaire: [],
      lectureCursive: [],
    };

    const weeklyScores = new Map<string, number[]>();

    for (const event of timeline) {
      if (event.type !== 'evaluation') {
        continue;
      }

      const score = eventToScore(event);
      if (score === null) {
        continue;
      }

      const skill = resolveSkill(event);
      scoreBuckets[skill].push(score);

      const key = weekKey(new Date(event.createdAt));
      const current = weeklyScores.get(key) ?? [];
      current.push(score);
      weeklyScores.set(key, current);
    }

    const scores: SkillScores = {
      oral: scoreBuckets.oral.length
        ? clampScore(scoreBuckets.oral.reduce((a, b) => a + b, 0) / scoreBuckets.oral.length)
        : DEFAULT_SCORES.oral,
      ecrit: scoreBuckets.ecrit.length
        ? clampScore(scoreBuckets.ecrit.reduce((a, b) => a + b, 0) / scoreBuckets.ecrit.length)
        : DEFAULT_SCORES.ecrit,
      grammaire: scoreBuckets.grammaire.length
        ? clampScore(scoreBuckets.grammaire.reduce((a, b) => a + b, 0) / scoreBuckets.grammaire.length)
        : DEFAULT_SCORES.grammaire,
      lectureCursive: scoreBuckets.lectureCursive.length
        ? clampScore(
            scoreBuckets.lectureCursive.reduce((a, b) => a + b, 0) / scoreBuckets.lectureCursive.length,
          )
        : DEFAULT_SCORES.lectureCursive,
    };

    const weeklyProgression = Array.from(weeklyScores.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, values]) => ({
        week,
        score: clampScore(values.reduce((a, b) => a + b, 0) / values.length),
      }));

    return {
      scores,
      weakSignals: data?.weakSignals ?? {},
      lastActivity: timeline[0]?.createdAt ?? null,
      totalSessions: timeline.filter((event) => event.type === 'navigation').length,
      streak: computeStreak(timeline),
      weeklyProgression,
      timeline,
      displayName: data?.profile.displayName ?? 'Élève',
      onboardingCompleted: data?.profile.onboardingCompleted ?? false,
      eafDate: data?.profile.eafDate ?? null,
      countdownDays:
        data?.profile.eafDate
          ? Math.max(
              0,
              Math.ceil(
                (new Date(data.profile.eafDate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : null,
      isLoading,
      error,
    };
  }, [data, error, isLoading]);
}
