/**
 * P0-SaaS-4 — Analyseur de Diction STT
 * Per ADDENDUM §Partie A, Différenciateur #4.
 *
 * Pure functions to compute diction metrics from STT word-level results.
 * No AI involved — these are quantitative metrics computed from timestamps.
 */

export interface STTWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface STTSegment {
  start: number;
  end: number;
  text: string;
}

export interface STTResult {
  transcript: string;
  words: STTWord[];
  segments: STTSegment[];
}

export interface DictionMetrics {
  wordsPerMinute: number;
  longPausesCount: number;
  disfluencesCount: number;
  averagePauseDurationMs: number;
  totalDurationMs: number;
  disfluenceWords: string[];
}

/** Threshold for a "long pause" in seconds. */
const LONG_PAUSE_THRESHOLD_S = 1.5;

/** Common French disfluences. */
const DISFLUENCE_PATTERNS = [
  'euh', 'hm', 'hum', 'hmm', 'ben', 'bah', 'voilà',
  'genre', 'en fait', 'du coup',
];

/**
 * Compute diction metrics from STT word-level data.
 * Per ADDENDUM Table 16: débit, pauses, disfluences, variation.
 */
export function computeDictionMetrics(result: STTResult): DictionMetrics {
  const { words } = result;

  if (words.length === 0) {
    return {
      wordsPerMinute: 0,
      longPausesCount: 0,
      disfluencesCount: 0,
      averagePauseDurationMs: 0,
      totalDurationMs: 0,
      disfluenceWords: [],
    };
  }

  // Total duration
  const firstStart = words[0].start;
  const lastEnd = words[words.length - 1].end;
  const totalDurationS = lastEnd - firstStart;
  const totalDurationMs = totalDurationS * 1000;

  // Words per minute
  const wordsPerMinute = totalDurationS > 0
    ? Math.round((words.length / totalDurationS) * 60)
    : 0;

  // Pauses between words
  const pauses: number[] = [];
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end;
    if (gap > 0) {
      pauses.push(gap);
    }
  }

  const longPausesCount = pauses.filter((p) => p >= LONG_PAUSE_THRESHOLD_S).length;
  const averagePauseDurationMs = pauses.length > 0
    ? Math.round((pauses.reduce((sum, p) => sum + p, 0) / pauses.length) * 1000)
    : 0;

  // Disfluences
  const disfluenceWords: string[] = [];
  for (const w of words) {
    const lower = w.word.toLowerCase().replace(/[.,!?;:]/g, '');
    if (DISFLUENCE_PATTERNS.includes(lower)) {
      disfluenceWords.push(w.word);
    }
  }

  return {
    wordsPerMinute,
    longPausesCount,
    disfluencesCount: disfluenceWords.length,
    averagePauseDurationMs,
    totalDurationMs,
    disfluenceWords,
  };
}

/** Target ranges per ADDENDUM Table 16. */
export const DICTION_TARGETS = {
  poetry: { minWPM: 90, maxWPM: 110, label: 'Poésie' },
  prose: { minWPM: 120, maxWPM: 150, label: 'Prose' },
  maxLongPauses: 2,
  maxDisfluences: 2,
} as const;

export type TextGenre = 'poetry' | 'prose';

/**
 * Generate actionable feedback from diction metrics.
 * Per ADDENDUM: feedback anchored on actual numbers, not subjective.
 */
export function generateDictionFeedback(
  metrics: DictionMetrics,
  genre: TextGenre,
): string[] {
  const feedback: string[] = [];
  const target = DICTION_TARGETS[genre];

  if (metrics.wordsPerMinute < target.minWPM) {
    feedback.push(
      `Tu lis à ${metrics.wordsPerMinute} mots/min. La ${target.label.toLowerCase()} demande ${target.minWPM}-${target.maxWPM} pour respecter la prosodie.`,
    );
  } else if (metrics.wordsPerMinute > target.maxWPM) {
    feedback.push(
      `Tu lis à ${metrics.wordsPerMinute} mots/min — c'est trop rapide pour la ${target.label.toLowerCase()}. Vise ${target.minWPM}-${target.maxWPM} mots/min.`,
    );
  }

  if (metrics.longPausesCount > DICTION_TARGETS.maxLongPauses) {
    feedback.push(
      `J'ai compté ${metrics.longPausesCount} longues pauses — travaille ta fluidité sur ces segments.`,
    );
  }

  if (metrics.disfluencesCount > DICTION_TARGETS.maxDisfluences) {
    feedback.push(
      `J'ai relevé ${metrics.disfluencesCount} hésitations vocales (${metrics.disfluenceWords.slice(0, 3).join(', ')}). Elles trahissent une lecture non mémorisée.`,
    );
  }

  if (feedback.length === 0) {
    feedback.push('Bonne diction ! Ton débit et ta fluidité sont dans les normes attendues.');
  }

  return feedback;
}
