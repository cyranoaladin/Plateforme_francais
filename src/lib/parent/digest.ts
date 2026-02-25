/**
 * Parent Dashboard — Weekly Digest Data Builder
 * Per cahier V2 §Sprint 4 (P1-3).
 *
 * Builds structured digest data for parent weekly emails and dashboard views.
 * All functions are pure — they take data arrays, return computed summaries.
 */

export interface WeeklyActivity {
  date: string;
  type: 'oral' | 'ecrit' | 'quiz' | 'revision';
  label: string;
  score: number | null;
  maxScore: number | null;
}

export interface WeeklyDigest {
  studentName: string;
  weekStart: string;
  weekEnd: string;
  activeDays: number;
  totalActivities: number;
  oralCount: number;
  ecritCount: number;
  quizCount: number;
  revisionCount: number;
  avgScore: number | null;
  streak: number;
  newBadges: string[];
  topActivity: WeeklyActivity | null;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
}

/**
 * Build a weekly digest from raw activity data.
 */
export function buildWeeklyDigest(
  studentName: string,
  activities: WeeklyActivity[],
  weekStart: Date,
  streak: number,
  newBadges: string[],
  previousWeekAvg: number | null,
): WeeklyDigest {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const oralCount = activities.filter((a) => a.type === 'oral').length;
  const ecritCount = activities.filter((a) => a.type === 'ecrit').length;
  const quizCount = activities.filter((a) => a.type === 'quiz').length;
  const revisionCount = activities.filter((a) => a.type === 'revision').length;

  const uniqueDays = new Set(activities.map((a) => a.date.slice(0, 10))).size;

  const scores = activities
    .filter((a) => a.score !== null && a.maxScore !== null && a.maxScore > 0)
    .map((a) => ((a.score as number) / (a.maxScore as number)) * 100);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : null;

  const topActivity = activities.length > 0
    ? activities.reduce((best, current) => {
        const bestRatio = best.score !== null && best.maxScore ? best.score / best.maxScore : 0;
        const currentRatio = current.score !== null && current.maxScore ? current.score / current.maxScore : 0;
        return currentRatio > bestRatio ? current : best;
      })
    : null;

  const trend = computeTrend(avgScore, previousWeekAvg);

  return {
    studentName,
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
    activeDays: uniqueDays,
    totalActivities: activities.length,
    oralCount,
    ecritCount,
    quizCount,
    revisionCount,
    avgScore,
    streak,
    newBadges,
    topActivity,
    trend,
  };
}

/**
 * Compute weekly trend by comparing this week's avg to previous week's avg.
 */
export function computeTrend(
  currentAvg: number | null,
  previousAvg: number | null,
): WeeklyDigest['trend'] {
  if (currentAvg === null || previousAvg === null) return 'insufficient_data';
  const diff = currentAvg - previousAvg;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

/**
 * Format a digest into a plain-text summary for email.
 */
export function digestToPlainText(digest: WeeklyDigest): string {
  const lines: string[] = [
    `Bilan hebdomadaire de ${digest.studentName}`,
    `Semaine du ${digest.weekStart} au ${digest.weekEnd}`,
    '',
    `Jours actifs : ${digest.activeDays}/7`,
    `Activités totales : ${digest.totalActivities}`,
    `  - Oral : ${digest.oralCount}`,
    `  - Écrit : ${digest.ecritCount}`,
    `  - Quiz : ${digest.quizCount}`,
    `  - Révision : ${digest.revisionCount}`,
    '',
    `Score moyen : ${digest.avgScore !== null ? `${digest.avgScore}%` : 'N/A'}`,
    `Streak : ${digest.streak} jours consécutifs`,
    `Tendance : ${trendLabel(digest.trend)}`,
  ];

  if (digest.newBadges.length > 0) {
    lines.push('', `Nouveaux badges : ${digest.newBadges.join(', ')}`);
  }

  return lines.join('\n');
}

function trendLabel(trend: WeeklyDigest['trend']): string {
  switch (trend) {
    case 'improving': return 'En progression ↗';
    case 'stable': return 'Stable →';
    case 'declining': return 'En baisse ↘';
    case 'insufficient_data': return 'Données insuffisantes';
  }
}
