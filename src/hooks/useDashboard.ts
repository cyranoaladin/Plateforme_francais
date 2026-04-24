'use client';

import { useEffect, useMemo, useState } from 'react';
import { resolveDashboardCountdowns, type ExamInfoPayload } from '@/lib/exam/exam-info';

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
    classLevel?: string;
    voie?: 'GENERALE' | 'TECHNOLOGIQUE';
    eafDate?: string;
    selectedOeuvres?: string[];
    oeuvreChoisieEntretien?: string;
    lecturesCursives?: string[];
  };
  timeline: MemoryEvent[];
  weakSignals: Record<string, number>;
  linkedStudents?: Array<{
    id: string;
    displayName: string;
    email: string;
    classLevel?: string;
  }>;
  linkageStatus?: 'linked' | 'unlinked';
};

type DashboardData = TimelineResponse & {
  examInfo?: ExamInfoPayload | null;
};

type SkillScores = {
  oral: number | null;
  ecrit: number | null;
  grammaire: number | null;
  lectureCursive: number | null;
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
  classLevel: string;
  voie: 'GENERALE' | 'TECHNOLOGIQUE';
  eafDate: string | null;
  selectedOeuvres: string[];
  oeuvreChoisieEntretien: string | null;
  lecturesCursives: string[];
  countdownDays: number | null;
  countdownEcrit: number | null;
  countdownOral: number | null;
  examInfo: ExamInfoPayload | null;
  hasEvaluationData: boolean;
  isLoading: boolean;
  error: string | null;
  linkedStudents: Array<{
    id: string;
    displayName: string;
    email: string;
    classLevel?: string;
  }>;
  linkageStatus: 'linked' | 'unlinked';
  emailVerified: string | null;
};

const EMPTY_SCORES: SkillScores = {
  oral: null,
  ecrit: null,
  grammaire: null,
  lectureCursive: null,
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

function averageBucket(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return clampScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function computeDashboardMetricsFromTimeline(
  data: DashboardData | null,
  isLoading: boolean = false,
  error: string | null = null,
): DashboardMetrics {
  const timeline = data?.timeline ?? [];
  const countdowns = resolveDashboardCountdowns(data?.examInfo);

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
    oral: averageBucket(scoreBuckets.oral),
    ecrit: averageBucket(scoreBuckets.ecrit),
    grammaire: averageBucket(scoreBuckets.grammaire),
    lectureCursive: averageBucket(scoreBuckets.lectureCursive),
  };

  const weeklyProgression = Array.from(weeklyScores.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, values]) => ({
      week,
      score: clampScore(values.reduce((sum, value) => sum + value, 0) / values.length),
    }));

  const hasEvaluationData = Object.values(scores).some((value) => typeof value === 'number');

  return {
    scores: hasEvaluationData ? scores : EMPTY_SCORES,
    weakSignals: data?.weakSignals ?? {},
    lastActivity: timeline[0]?.createdAt ?? null,
    totalSessions: timeline.filter((event) => event.type === 'navigation').length,
    streak: computeStreak(timeline),
    weeklyProgression,
    timeline,
    displayName: (data?.profile.displayName ?? 'Élève').replace(/\s*\([^)]+\)\s*$/, '').trim(),
    onboardingCompleted: data?.profile.onboardingCompleted ?? false,
    classLevel: data?.profile.classLevel ?? 'Première générale',
    voie: data?.profile.voie ?? 'GENERALE',
    eafDate: data?.profile.eafDate ?? null,
    selectedOeuvres: data?.profile.selectedOeuvres ?? [],
    oeuvreChoisieEntretien: data?.profile.oeuvreChoisieEntretien ?? null,
    lecturesCursives: data?.profile.lecturesCursives ?? [],
    countdownDays: countdowns.countdownDays,
    countdownEcrit: countdowns.countdownEcrit,
    countdownOral: countdowns.countdownOral,
    examInfo: data?.examInfo ?? null,
    hasEvaluationData,
    isLoading,
    error,
    linkedStudents: data?.linkedStudents ?? [],
    linkageStatus: data?.linkageStatus ?? 'linked',
    emailVerified: (data as Record<string, unknown>)?.emailVerified as string | null ?? null,
  };
}

export function useDashboard(endpoint: string = '/api/v1/memory/timeline?limit=200'): DashboardMetrics {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [response, examInfoResponse] = await Promise.all([
          fetch(endpoint),
          fetch('/api/v1/exam-info'),
        ]);
        const officialExamInfo = examInfoResponse.ok
          ? await examInfoResponse.json() as ExamInfoPayload
          : null;

        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login — do not silently swallow auth errors
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            setError('Session expirée. Redirection vers la connexion…');
            return;
          }
          throw new Error('Impossible de charger la timeline.');
        }

        const payload = (await response.json()) as TimelineResponse;
        setData({ ...payload, examInfo: officialExamInfo });
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [endpoint]);

  return useMemo(() => computeDashboardMetricsFromTimeline(data, isLoading, error), [data, error, isLoading]);
}
