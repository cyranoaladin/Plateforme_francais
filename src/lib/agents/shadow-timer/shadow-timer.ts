/**
 * P0-SaaS-3 — Shadow Timer Cognitif
 * Per ADDENDUM §Partie A, Différenciateur #3.
 *
 * Observes preparation metrics silently and generates nudges
 * when time misallocation or blocage is detected.
 * Max frequency: 1 nudge per 5 minutes (no spam).
 */

export interface PrepHeartbeat {
  sessionId: string;
  notesLength: number;
  hasProcedes: boolean;
  hasGrammaire: boolean;
  timeElapsedMs: number;
}

export interface ShadowNudge {
  type: 'blocage' | 'time_allocation' | 'grammaire_missing' | 'procedes_missing' | 'prep_end';
  emoji: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

/** Total preparation time in ms (30 minutes). */
export const PREP_TOTAL_MS = 30 * 60 * 1000;

/** Minimum interval between nudges in ms (5 minutes). */
export const NUDGE_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Shadow Timer nudge rules per ADDENDUM Table 13.
 * Each rule is evaluated in order; first match wins.
 */
export function evaluateNudgeRules(
  heartbeat: PrepHeartbeat,
  lastNudgeAtMs: number | null,
  nowMs: number = Date.now(),
): ShadowNudge | null {
  // Enforce cooldown
  if (lastNudgeAtMs !== null && (nowMs - lastNudgeAtMs) < NUDGE_COOLDOWN_MS) {
    return null;
  }

  const remainingMs = PREP_TOTAL_MS - heartbeat.timeElapsedMs;
  const remainingMin = remainingMs / 60_000;

  // Rule 5: Timer ended
  if (remainingMs <= 0) {
    return {
      type: 'prep_end',
      emoji: '🎯',
      message: 'Préparez-vous à commencer. Votre temps de préparation est écoulé.',
      priority: 'high',
    };
  }

  // Rule 1: No typing for > 3 min and < 20 min remaining
  if (heartbeat.notesLength < 10 && heartbeat.timeElapsedMs > 3 * 60_000 && remainingMin < 20) {
    return {
      type: 'blocage',
      emoji: '💡',
      message: 'Tu sembles bloqué. As-tu identifié tes 3 axes principaux ?',
      priority: 'medium',
    };
  }

  // Rule 2: Too much time on intro (>60% of elapsed time implied by short notes vs time)
  // Heuristic: if time > 15 min and notes are short relative to time spent
  if (heartbeat.timeElapsedMs > 15 * 60_000 && heartbeat.notesLength < 200 && remainingMin < 15) {
    return {
      type: 'time_allocation',
      emoji: '⏰',
      message: 'Tu passes beaucoup de temps sur l\'intro. Passe au développement.',
      priority: 'medium',
    };
  }

  // Rule 3: Grammar not addressed, 10 min remaining
  if (!heartbeat.hasGrammaire && remainingMin <= 10 && remainingMin > 5) {
    return {
      type: 'grammaire_missing',
      emoji: '📝',
      message: 'Il te reste 10 min. Pense à noter ta réponse à la question de grammaire.',
      priority: 'high',
    };
  }

  // Rule 4: No procédés noted, 5 min remaining
  if (!heartbeat.hasProcedes && remainingMin <= 5 && remainingMin > 0) {
    return {
      type: 'procedes_missing',
      emoji: '🔍',
      message: 'Prépare 2-3 citations clés avec leurs procédés — essentiel pour l\'explication.',
      priority: 'high',
    };
  }

  return null;
}

/**
 * Detect presence of literary devices (procédés) in preparation notes.
 * Simple keyword-based heuristic for the Shadow Agent.
 */
export function detectsProcedes(notes: string): boolean {
  const lower = notes.toLowerCase();
  const keywords = [
    'métaphore', 'comparaison', 'allitération', 'assonance', 'anaphore',
    'antithèse', 'chiasme', 'hyperbole', 'litote', 'oxymore',
    'personnification', 'synecdoque', 'métonymie', 'enjambement',
    'procédé', 'figure', 'stylistique', 'rhétorique', 'césure',
  ];
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Detect grammar-related content in preparation notes.
 */
export function detectsGrammaire(notes: string): boolean {
  const lower = notes.toLowerCase();
  const keywords = [
    'subjonctif', 'conditionnel', 'passé simple', 'plus-que-parfait',
    'grammaire', 'conjugaison', 'syntaxe', 'proposition', 'relative',
    'subordonnée', 'complétive', 'participe', 'gérondif', 'attribut',
    'cod', 'coi', 'apposition', 'épithète', 'négation', 'interrogati',
  ];
  return keywords.some((kw) => lower.includes(kw));
}
