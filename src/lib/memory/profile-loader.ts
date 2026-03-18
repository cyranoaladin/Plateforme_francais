import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { refreshMemorySummaries } from '@/lib/db/repositories/learningMemoryRepo';
import { findUserById } from '@/lib/db/repositories/userRepo';
import { listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';
import { estimateGlobalLevel, type SkillLevel, type WeakSeverity } from '@/lib/memory/scoring';
import type { MemoryProfile, WeakSkillSummary, WorkMasterySummary } from '@/lib/memory/context-builder';
import { LRUCache } from '@/lib/cache/lru';

/** 5-minute LRU cache for student memory profiles (saves 3 DB queries per hit). */
const profileCache = new LRUCache<MemoryProfile>({ maxSize: 200, defaultTtlMs: 300_000 });

/** Invalidate profile cache for a user (call after profile updates). */
export function invalidateProfileCache(userId: string): void {
  profileCache.invalidatePrefix(`profile:${userId}:`);
}

type LightweightEvent = {
  type: string;
  feature: string;
  path?: string;
  createdAt: string;
  payload?: Record<string, string | number | boolean | string[]>;
};

const LEGACY_WEAK_SKILL_MAP: Array<{ pattern: RegExp; skill: string }> = [
  { pattern: /grammaire|langue/i, skill: 'TRANS_LANGUE_GRAMMAIRE' },
  { pattern: /syntaxe/i, skill: 'TRANS_LANGUE_SYNTAXE' },
  { pattern: /style/i, skill: 'TRANS_LANGUE_STYLE' },
  { pattern: /lecture/i, skill: 'ORAL_LECTURE_FLUIDITE' },
  { pattern: /entretien/i, skill: 'ORAL_ENTRETIEN_CONNAISSANCE' },
  { pattern: /oral|explication|analyse/i, skill: 'ORAL_EXPLIC_ANALYSE' },
  { pattern: /citation/i, skill: 'ECRIT_COMMENT_CITATIONS' },
  { pattern: /plan|problematique|commentaire|dissertation|ecrit/i, skill: 'ECRIT_COMMENT_PLAN' },
];

function toDaysAgo(value: Date | string | null | undefined): number {
  if (!value) return 999;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 999;
  return Math.max(0, Math.round((Date.now() - timestamp) / 86_400_000));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
}

function normalizeScore(score: number, maxScore: number): number {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(20, Math.round(((score / maxScore) * 20) * 10) / 10));
}

function guessLegacyWeakSkill(label: string): string {
  const found = LEGACY_WEAK_SKILL_MAP.find((entry) => entry.pattern.test(label));
  return found?.skill ?? 'TRANS_LANGUE_GRAMMAIRE';
}

function buildLegacyWeakSkills(labels: string[] | undefined): WeakSkillSummary[] {
  return (labels ?? []).slice(0, 6).map((label) => ({
    skill: guessLegacyWeakSkill(label),
    pattern: label,
    severity: 'MEDIUM' as WeakSeverity,
    frequency: 1,
    lastOccurrenceDaysAgo: 14,
  }));
}

function shortFeatureLabel(event: LightweightEvent): string {
  if (event.path === '/atelier-oral' || event.feature.includes('oral')) return 'oral';
  if (event.path === '/atelier-langue' || event.feature.includes('langue')) return 'langue';
  if (event.path === '/atelier-ecrit' || event.feature.includes('copie') || event.feature.includes('epreuve')) return 'écrit';
  if (event.path === '/bibliotheque' || event.feature.includes('resource')) return 'ressource';
  if (event.path === '/quiz' || event.feature.includes('quiz')) return 'quiz';
  if (event.feature.includes('tuteur') || event.feature.includes('chat')) return 'accompagnement';
  return event.feature.replace(/_/g, ' ');
}

function buildRecentSessionsSummary(events: LightweightEvent[]): string | null {
  if (events.length === 0) return null;

  const summary = events
    .slice(0, 4)
    .map((event) => {
      const daysAgo = toDaysAgo(event.createdAt);
      const when = daysAgo === 0 ? 'aujourd’hui' : `il y a ${daysAgo}j`;
      return `${shortFeatureLabel(event)} (${when})`;
    })
    .join(' ; ');

  return summary.length > 0 ? summary : null;
}

function scoresFromEvents(events: LightweightEvent[]) {
  const oral: number[] = [];
  const ecrit: number[] = [];

  for (const event of events) {
    const rawScore = event.payload?.score;
    const rawMax = event.payload?.max;
    if (typeof rawScore !== 'number' || typeof rawMax !== 'number') {
      continue;
    }

    const score = normalizeScore(rawScore, rawMax);
    const text = `${event.feature} ${event.path ?? ''}`.toLowerCase();

    if (text.includes('oral')) {
      oral.push(score);
      continue;
    }

    if (text.includes('copie') || text.includes('epreuve') || text.includes('ecrit')) {
      ecrit.push(score);
    }
  }

  return {
    avgOralScore: average(oral),
    avgEcritScore: average(ecrit),
  };
}

function deriveGlobalLevel(
  explicitLevel: SkillLevel | null | undefined,
  avgOralScore: number | null,
  avgEcritScore: number | null,
): SkillLevel {
  if (explicitLevel) {
    return explicitLevel;
  }

  const normalizedInputs = [avgOralScore, avgEcritScore]
    .filter((value): value is number => value !== null)
    .map((value) => value / 20);

  if (normalizedInputs.length === 0) {
    return 'PASSABLE';
  }

  const avg = normalizedInputs.reduce((sum, value) => sum + value, 0) / normalizedInputs.length;
  return estimateGlobalLevel(avg);
}

export async function loadMemoryProfileForUser(
  userId: string,
  opts?: { workId?: string },
): Promise<MemoryProfile | null> {
  const cacheKey = `profile:${userId}:${opts?.workId ?? 'none'}`;
  const cached = profileCache.get(cacheKey);
  if (cached) return cached;

  const recentTimeline = (await listMemoryEventsByUser(userId, 24)) as LightweightEvent[];

  if (await isDatabaseAvailable()) {
    const [profile, evaluations] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId },
        select: {
          globalLevel: true,
          classLevel: true,
          voie: true,
          selectedOeuvres: true,
          eafDate: true,
          weakSkills: true,
          weakSkillEntries: {
            where: { status: { in: ['ACTIVE', 'IMPROVING'] } },
            orderBy: [{ severity: 'desc' }, { lastOccurrence: 'desc' }],
            take: 8,
            select: {
              skill: true,
              pattern: true,
              severity: true,
              frequency: true,
              lastOccurrence: true,
            },
          },
          workMasteries: opts?.workId
            ? {
                where: { workId: opts.workId },
                take: 1,
                select: {
                  workId: true,
                  masteryLevel: true,
                  strongThemes: true,
                  weakThemes: true,
                  lastSessionAt: true,
                },
              }
            : false,
        },
      }),
      prisma.evaluation.findMany({
        where: { userId },
        orderBy: { evaluatedAt: 'desc' },
        take: 24,
        select: {
          kind: true,
          score: true,
          maxScore: true,
        },
      }),
    ]);

    const oralScores = evaluations
      .filter((item) => item.kind.toLowerCase().includes('oral'))
      .map((item) => normalizeScore(item.score, item.maxScore));
    const ecritScores = evaluations
      .filter((item) => item.kind.toLowerCase().includes('ecrit') || item.kind.toLowerCase().includes('copie'))
      .map((item) => normalizeScore(item.score, item.maxScore));

    const eventScores = scoresFromEvents(recentTimeline);
    const avgOralScore = average(oralScores) ?? eventScores.avgOralScore;
    const avgEcritScore = average(ecritScores) ?? eventScores.avgEcritScore;

    const weakSkills = profile?.weakSkillEntries.length
      ? profile.weakSkillEntries.map((entry) => ({
          skill: entry.skill,
          pattern: entry.pattern,
          severity: entry.severity as WeakSeverity,
          frequency: entry.frequency,
          lastOccurrenceDaysAgo: toDaysAgo(entry.lastOccurrence),
        }))
      : buildLegacyWeakSkills(profile?.weakSkills);

    const currentWork = Array.isArray(profile?.workMasteries) && profile.workMasteries[0]
      ? ({
          workTitle: profile.workMasteries[0].workId,
          masteryLevel: profile.workMasteries[0].masteryLevel,
          strongThemes: Array.isArray(profile.workMasteries[0].strongThemes) ? (profile.workMasteries[0].strongThemes as string[]) : [],
          weakThemes: Array.isArray(profile.workMasteries[0].weakThemes) ? (profile.workMasteries[0].weakThemes as string[]) : [],
          lastSessionDaysAgo: toDaysAgo(profile.workMasteries[0].lastSessionAt),
        } satisfies WorkMasterySummary)
      : null;

    const result: MemoryProfile = {
      globalLevel: deriveGlobalLevel(profile?.globalLevel as SkillLevel | undefined, avgOralScore, avgEcritScore),
      avgOralScore,
      avgEcritScore,
      totalSessions: recentTimeline.length,
      weakSkills,
      currentWorkMastery: currentWork,
      recentSessionsSummary: buildRecentSessionsSummary(recentTimeline),
      classLevel: profile?.classLevel ?? undefined,
      voie: profile?.voie ?? undefined,
      selectedOeuvres: profile?.selectedOeuvres.length ? profile.selectedOeuvres : undefined,
      eafDate: profile?.eafDate ? profile.eafDate.toISOString().split('T')[0] : undefined,
    };

    profileCache.set(cacheKey, result);
    void refreshMemorySummaries({ userId, profile: result }).catch(() => undefined);
    return result;
  }

  const fallbackUser = await findUserById(userId);
  if (!fallbackUser) {
    return null;
  }

  const eventScores = scoresFromEvents(recentTimeline);
  return {
    globalLevel: deriveGlobalLevel(undefined, eventScores.avgOralScore, eventScores.avgEcritScore),
    avgOralScore: eventScores.avgOralScore,
    avgEcritScore: eventScores.avgEcritScore,
    totalSessions: recentTimeline.length,
    weakSkills: buildLegacyWeakSkills(fallbackUser.profile.weakSkills),
    currentWorkMastery: null,
    recentSessionsSummary: buildRecentSessionsSummary(recentTimeline),
  };
}
