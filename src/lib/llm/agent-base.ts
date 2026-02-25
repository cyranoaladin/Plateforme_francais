/**
 * Agent output validation guardrails.
 *
 * Every agent output passes through validateAgentOutput() to ensure:
 * - No external URLs or redirections
 * - No forbidden phrases directing users outside the platform
 * - Score values within expected bounds
 * - Minimum response length
 *
 * @module agent-base
 */

import { logger } from '@/lib/logger';

const URL_PATTERN = /https?:\/\/[^\s)}\]"']+/gi;

const FORBIDDEN_PHRASES = [
  'consulte ce lien',
  'consulte cette page',
  'consulte ce site',
  'voir sur eduscol',
  'voir sur wikipedia',
  'tu peux lire sur',
  'tu trouveras sur',
  'cherche sur google',
  'cherche sur internet',
  'ce lien',
  'ce site',
  'cette page web',
  'eduscol.education.fr',
  'wikipedia.org',
  'letudiant.fr',
  'superprof.fr',
  'kartable.fr',
  'annabac.com',
];

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  urls?: string[];
  forbiddenPhrases?: string[];
}

/**
 * Validate an agent's textual output for external redirections and forbidden phrases.
 * Called automatically by the orchestrator after every LLM response.
 */
export function validateAgentOutput(output: string): ValidationResult {
  if (!output || typeof output !== 'string') {
    return { valid: true };
  }

  const lower = output.toLowerCase();
  const urls = output.match(URL_PATTERN) ?? [];
  const foundForbidden = FORBIDDEN_PHRASES.filter((phrase) =>
    lower.includes(phrase.toLowerCase()),
  );

  if (urls.length > 0 || foundForbidden.length > 0) {
    logger.warn(
      { urls, forbiddenPhrases: foundForbidden, outputLength: output.length },
      'agent.output_validation.violation_detected',
    );
    return {
      valid: false,
      reason: 'external_redirect_detected',
      urls: urls.length > 0 ? urls : undefined,
      forbiddenPhrases: foundForbidden.length > 0 ? foundForbidden : undefined,
    };
  }

  return { valid: true };
}

/**
 * Sanitize an agent output by removing any detected URLs and replacing
 * forbidden redirect phrases with a safe alternative.
 */
export function sanitizeAgentOutput(output: string): string {
  let sanitized = output.replace(URL_PATTERN, '[référence interne]');

  for (const phrase of FORBIDDEN_PHRASES) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    sanitized = sanitized.replace(regex, 'dans les documents de ta base');
  }

  return sanitized;
}

/**
 * Instruction appended to ALL agent system prompts to enforce zero external links.
 */
export const NO_EXTERNAL_LINKS_INSTRUCTION = `
RÈGLE ABSOLUE — ZÉRO LIEN EXTERNE :
Tu ne fournis JAMAIS d'URLs, de liens, de noms de sites web, ni de références à des ressources extérieures.
Tu ne dis JAMAIS « consulte ce lien », « voir sur Eduscol », « cherche sur Google », « tu trouveras sur Wikipedia ».
Si tu n'as pas l'information dans ton contexte RAG, dis-le honnêtement :
« Cette information n'est pas dans ma base de documents. Je peux te proposer : [alternative interne]. »
Toute l'information que tu transmets doit provenir EXCLUSIVEMENT du contexte RAG fourni.
`.trim();

/**
 * Validate that a numeric score is within the expected [0, max] range.
 * Returns the clamped value.
 */
export function clampScore(score: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(score * 10) / 10));
}

/**
 * Check minimum response quality: output must be at least minChars long.
 * Returns false if the response is suspiciously short.
 */
export function isResponseSufficient(output: string, minChars = 50): boolean {
  return output.trim().length >= minChars;
}
