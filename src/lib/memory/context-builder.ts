/**
 * P0-SaaS-5 — Memory Context Builder
 * Per ADDENDUM §B.5.
 *
 * Builds a targeted memory context (< 400 tokens) for injection
 * into agent system prompts. Each agent type gets a different view.
 *
 * Rule: the context is ALWAYS injected invisibly. The agent never says
 * "D'après ton profil..." — it adapts silently.
 */

import {
  type SkillLevel,
  type WeakSeverity,
} from './scoring';

/** Max tokens for memory context injection. */
export const MAX_MEMORY_TOKENS = 400;

export type AgentType =
  | 'TIRAGE_ORAL'
  | 'SHADOW_PREP'
  | 'COACH_LECTURE'
  | 'COACH_EXPLICATION'
  | 'GRAMMAIRE_CIBLEE'
  | 'ENTRETIEN_OEUVRE'
  | 'BILAN_ORAL'
  | 'DIAGNOSTIC_ECRIT'
  | 'PASTICHE'
  | 'QUIZ_ADAPTATIF'
  | 'EXAMINATEUR_VIRTUEL';

export type SummaryType = 'FULL' | 'ORAL' | 'ECRIT' | 'RECENT_SESSIONS' | 'WEAK_SKILLS';

export interface MemoryContextOptions {
  agentType: AgentType;
  workId?: string;
  maxTokens?: number;
  focus?: string[];
}

export interface WeakSkillSummary {
  skill: string;
  pattern: string;
  severity: WeakSeverity;
  frequency: number;
  lastOccurrenceDaysAgo: number;
}

export interface WorkMasterySummary {
  workTitle: string;
  masteryLevel: number;
  strongThemes: string[];
  weakThemes: string[];
  lastSessionDaysAgo: number | null;
}

export interface MemoryProfile {
  globalLevel: SkillLevel;
  avgOralScore: number | null;
  avgEcritScore: number | null;
  totalSessions: number;
  weakSkills: WeakSkillSummary[];
  currentWorkMastery: WorkMasterySummary | null;
  recentSessionsSummary: string | null;
}

/**
 * Map agent type → required SummaryType per ADDENDUM Table 39.
 */
export function mapAgentToSummaryType(agentType: AgentType): SummaryType {
  switch (agentType) {
    case 'TIRAGE_ORAL':
    case 'COACH_LECTURE':
    case 'COACH_EXPLICATION':
    case 'GRAMMAIRE_CIBLEE':
    case 'ENTRETIEN_OEUVRE':
    case 'EXAMINATEUR_VIRTUEL':
      return 'ORAL';
    case 'SHADOW_PREP':
      return 'RECENT_SESSIONS';
    case 'BILAN_ORAL':
    case 'QUIZ_ADAPTATIF':
      return 'FULL';
    case 'DIAGNOSTIC_ECRIT':
    case 'PASTICHE':
      return 'ECRIT';
  }
}

/**
 * Compose a memory context string from profile data.
 * Output is Markdown, < 400 tokens, for system prompt injection.
 *
 * Per ADDENDUM §B.5 "Règle d'or: Invisible mais actif":
 * - Agent never says "D'après ton profil..."
 * - Adapts silently. The instruction is embedded in the context.
 */
export function composeMemoryContext(profile: MemoryProfile, opts: MemoryContextOptions): string {
  const lines: string[] = [
    '--- PROFIL ÉLÈVE (interne — ne pas mentionner explicitement) ---',
  ];

  // Global level + scores
  const scoreStr = [
    profile.avgOralScore !== null ? `oral : ${profile.avgOralScore}/20 moy.` : null,
    profile.avgEcritScore !== null ? `écrit : ${profile.avgEcritScore}/20 moy.` : null,
  ].filter(Boolean).join(', ');

  lines.push(`Niveau : ${profile.globalLevel}${scoreStr ? ` (${scoreStr} sur ${profile.totalSessions} sessions)` : ''}`);

  // Weak skills (top 3)
  const relevantWeak = filterWeakSkillsByAgent(profile.weakSkills, opts.agentType);
  if (relevantWeak.length > 0) {
    lines.push('Lacunes actives :');
    for (const ws of relevantWeak.slice(0, 3)) {
      const tag = `[${ws.severity}]`;
      const recency = ws.lastOccurrenceDaysAgo <= 7 ? `dernière : ${ws.lastOccurrenceDaysAgo}j` : '';
      lines.push(`  ${tag} ${ws.pattern} (${ws.frequency} occ.${recency ? `, ${recency}` : ''})`);
    }
  }

  // Work mastery (if relevant work)
  if (profile.currentWorkMastery) {
    const wm = profile.currentWorkMastery;
    const pct = Math.round(wm.masteryLevel * 100);
    const ago = wm.lastSessionDaysAgo !== null ? ` — dernière session il y a ${wm.lastSessionDaysAgo} jours` : '';
    lines.push(`Maîtrise œuvre actuelle (${wm.workTitle}) : ${pct}%${ago}`);
    if (wm.weakThemes.length > 0) {
      lines.push(`  Points faibles : ${wm.weakThemes.join(', ')}`);
    }
  }

  // Recent sessions summary
  if (profile.recentSessionsSummary) {
    lines.push(`Dernières sessions : ${profile.recentSessionsSummary}`);
  }

  // Instruction for agent behavior
  lines.push('Instruction : utilise ces informations pour orienter ta pédagogie.');
  lines.push('             Ne les cite pas tels quels. Agis naturellement.');

  return lines.join('\n');
}

/**
 * Filter weak skills relevant to a specific agent type.
 * Per ADDENDUM Table 39: each agent only sees specific skill categories.
 */
export function filterWeakSkillsByAgent(
  weakSkills: WeakSkillSummary[],
  agentType: AgentType,
): WeakSkillSummary[] {
  const prefixMap: Record<AgentType, string[] | null> = {
    TIRAGE_ORAL: null, // No weak skills injected
    SHADOW_PREP: null,
    COACH_LECTURE: ['ORAL_LECTURE_'],
    COACH_EXPLICATION: ['ORAL_EXPLIC_'],
    GRAMMAIRE_CIBLEE: ['ORAL_GRAMM_'],
    ENTRETIEN_OEUVRE: ['ORAL_ENTRETIEN_'],
    BILAN_ORAL: null, // Gets all
    DIAGNOSTIC_ECRIT: ['TRANS_LANGUE_'],
    PASTICHE: ['TRANS_LANGUE_STYLE'],
    QUIZ_ADAPTATIF: null, // Gets all
    EXAMINATEUR_VIRTUEL: ['ORAL_ENTRETIEN_'],
  };

  const prefixes = prefixMap[agentType];

  // null with these agents: TIRAGE_ORAL, SHADOW_PREP get none
  if (agentType === 'TIRAGE_ORAL' || agentType === 'SHADOW_PREP') {
    return [];
  }

  // BILAN_ORAL and QUIZ_ADAPTATIF get all
  if (prefixes === null) {
    return weakSkills;
  }

  return weakSkills.filter((ws) =>
    prefixes.some((prefix) => ws.skill.startsWith(prefix)),
  );
}

/**
 * Estimate token count for a context string.
 * Rough heuristic: ~4 chars per token for French text.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate context to fit within token budget.
 */
export function truncateToTokenBudget(text: string, maxTokens: number = MAX_MEMORY_TOKENS): string {
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) return text;

  // Truncate by character count
  const maxChars = maxTokens * 4;
  const truncated = text.slice(0, maxChars);
  const lastNewline = truncated.lastIndexOf('\n');
  return lastNewline > 0 ? truncated.slice(0, lastNewline) : truncated;
}
