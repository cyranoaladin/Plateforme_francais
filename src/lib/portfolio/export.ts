/**
 * Portfolio Export — Per cahier V2 §Sprint 5.
 *
 * Exports user EAF progress data as JSON, CSV, or structured PDF-ready payload.
 * Covers: oral sessions, écrit copies, badges, scores, spaced repetition stats.
 */

export interface OralSessionExport {
  id: string;
  oeuvre: string;
  date: string;
  mode: string;
  status: string;
  totalScore: number | null;
  phases: Array<{
    phase: string;
    score: number;
    maxScore: number;
    feedback: string;
  }>;
}

export interface EcritCopieExport {
  id: string;
  type: string;
  date: string;
  score: number | null;
  mention: string | null;
  feedback: string | null;
}

export interface BadgeExport {
  name: string;
  description: string;
  earnedAt: string;
}

export interface PortfolioData {
  student: {
    displayName: string;
    anneeScolaire: string;
    exportDate: string;
  };
  oralSessions: OralSessionExport[];
  ecritCopies: EcritCopieExport[];
  badges: BadgeExport[];
  summary: {
    totalOralSessions: number;
    avgOralScore: number | null;
    totalEcritCopies: number;
    avgEcritScore: number | null;
    badgeCount: number;
    bestOralScore: number | null;
    bestEcritScore: number | null;
  };
}

/**
 * Compute summary statistics from portfolio data arrays.
 */
export function computeSummary(
  oralSessions: OralSessionExport[],
  ecritCopies: EcritCopieExport[],
  badges: BadgeExport[],
): PortfolioData['summary'] {
  const oralScores = oralSessions
    .map((s) => s.totalScore)
    .filter((s): s is number => s !== null && s !== undefined);

  const ecritScores = ecritCopies
    .map((c) => c.score)
    .filter((s): s is number => s !== null && s !== undefined);

  return {
    totalOralSessions: oralSessions.length,
    avgOralScore: oralScores.length > 0
      ? Math.round((oralScores.reduce((a, b) => a + b, 0) / oralScores.length) * 100) / 100
      : null,
    totalEcritCopies: ecritCopies.length,
    avgEcritScore: ecritScores.length > 0
      ? Math.round((ecritScores.reduce((a, b) => a + b, 0) / ecritScores.length) * 100) / 100
      : null,
    badgeCount: badges.length,
    bestOralScore: oralScores.length > 0 ? Math.max(...oralScores) : null,
    bestEcritScore: ecritScores.length > 0 ? Math.max(...ecritScores) : null,
  };
}

/**
 * Convert portfolio data to CSV format (oral sessions).
 */
export function oralSessionsToCsv(sessions: OralSessionExport[]): string {
  const header = 'id,oeuvre,date,mode,status,totalScore';
  const rows = sessions.map((s) =>
    [s.id, csvEscape(s.oeuvre), s.date, s.mode, s.status, s.totalScore ?? ''].join(',')
  );
  return [header, ...rows].join('\n');
}

/**
 * Convert portfolio data to CSV format (écrit copies).
 */
export function ecritCopiesToCsv(copies: EcritCopieExport[]): string {
  const header = 'id,type,date,score,mention';
  const rows = copies.map((c) =>
    [c.id, csvEscape(c.type), c.date, c.score ?? '', csvEscape(c.mention ?? '')].join(',')
  );
  return [header, ...rows].join('\n');
}

/**
 * Escape a CSV field value.
 */
function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert portfolio data to JSON export string.
 */
export function portfolioToJson(data: PortfolioData): string {
  return JSON.stringify(data, null, 2);
}
