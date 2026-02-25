import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Anti-triche classification for all generative endpoints.
 *
 * Policy: The platform NEVER produces complete essays, dissertations,
 * commentaires composés, or oral explanations. It provides methodology,
 * guidance, structured feedback, and partial examples only.
 *
 * When a forbidden request is detected, the system returns a structured
 * refusal with pedagogical guidance instead.
 */

export const FORBIDDEN_PATTERNS: ReadonlyArray<{ pattern: RegExp; category: string }> = [
  { pattern: /r[ée]dige[sz]?\s+(moi\s+)?(un[e]?\s+)?(dissertation|commentaire|contraction|essai|explication)/i, category: 'redaction_complete' },
  { pattern: /[ée]cri[st]?\s+(moi\s+)?(un[e]?\s+)?(dissertation|commentaire|contraction|essai|introduction|conclusion)/i, category: 'redaction_complete' },
  { pattern: /fai[st]?\s+(moi\s+)?(un[e]?\s+)?(dissertation|commentaire|contraction|essai)/i, category: 'redaction_complete' },
  { pattern: /donne[sz]?[\s-]+(moi\s+)?(un[e]?\s+)?(copie|r[ée]daction|corrig[ée])\s+(compl[èe]te|enti[èe]re|int[ée]grale)/i, category: 'copie_complete' },
  { pattern: /corrig[ée]\s+type\s+(complet|int[ée]gral)/i, category: 'copie_complete' },
  { pattern: /r[ée]pon[ds]+\s+[àa]\s+ma\s+place/i, category: 'substitution' },
  { pattern: /fai[st]?\s+(le|mon)\s+(devoir|travail)\s+[àa]\s+ma\s+place/i, category: 'substitution' },
  { pattern: /g[ée]n[èe]re\s+(un[e]?\s+)?(copie|r[ée]daction)\s+(compl[èe]te|pr[êe]te)/i, category: 'copie_complete' },
  { pattern: /fai[st]?\s+l'explication\s+lin[ée]aire/i, category: 'redaction_complete' },
  { pattern: /donne[sz]?[\s-]+(moi\s+)?(le\s+)?plan\s+complet\s+avec\s+(introduction|conclusion)/i, category: 'copie_complete' },
  { pattern: /quel\s+est\s+le\s+corrig[ée]\s+de/i, category: 'copie_complete' },
  { pattern: /passe[sz]?\s+(mon\s+)?oral\s+[àa]\s+ma\s+place/i, category: 'substitution' },
  { pattern: /simule[sz]?\s+(ma\s+)?r[ée]ponse\s+compl[èe]te/i, category: 'substitution' },
  { pattern: /r[ée]sou[dst]?\s+(l'exercice|la\s+question)\s+de\s+grammaire\s+[àa]\s+ma\s+place/i, category: 'substitution' },
];

export const antiTricheResultSchema = z.object({
  allowed: z.boolean(),
  category: z.string().optional(),
  refusalMessage: z.string().optional(),
  guidanceMessage: z.string().optional(),
});

export type AntiTricheResult = z.infer<typeof antiTricheResultSchema>;

const GUIDANCE_BY_CATEGORY: Record<string, { refusal: string; guidance: string }> = {
  redaction_complete: {
    refusal: 'Je ne peux pas rédiger un texte complet à ta place — ce serait de la triche et ça ne t\'aiderait pas à progresser.',
    guidance: 'En revanche, je peux t\'aider à : (1) construire un plan détaillé, (2) formuler une problématique, (3) rédiger une phrase d\'amorce, (4) analyser un procédé stylistique, (5) te donner un feedback sur un paragraphe que tu as écrit.',
  },
  copie_complete: {
    refusal: 'Fournir une copie complète ou un corrigé intégral n\'est pas autorisé — l\'objectif est que tu construises toi-même ta réponse.',
    guidance: 'Je peux te proposer : (1) une méthodologie pas-à-pas, (2) des exemples de transitions, (3) une analyse de tes points forts et axes d\'amélioration, (4) des citations pertinentes à exploiter.',
  },
  substitution: {
    refusal: 'Je ne peux pas faire ton travail à ta place — mon rôle est de t\'accompagner, pas de te remplacer.',
    guidance: 'Commence par écrire une première version, même imparfaite. Je t\'aiderai ensuite à l\'améliorer avec des conseils ciblés, des corrections de langue et des pistes d\'approfondissement.',
  },
};

const DEFAULT_GUIDANCE = {
  refusal: 'Cette demande n\'est pas compatible avec l\'accompagnement pédagogique de la plateforme.',
  guidance: 'Reformule ta question pour demander de l\'aide méthodologique, un feedback sur ton travail, ou des pistes d\'amélioration.',
};

/**
 * Classify a user query and determine if it's allowed.
 * Returns { allowed: true } for legitimate requests.
 * Returns { allowed: false, category, refusalMessage, guidanceMessage } for forbidden ones.
 */
export function classifyAntiTriche(userQuery: string | undefined | null): AntiTricheResult {
  if (!userQuery || typeof userQuery !== 'string') {
    return { allowed: true };
  }
  const trimmed = userQuery.trim();
  if (trimmed.length === 0) {
    return { allowed: true };
  }

  for (const { pattern, category } of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) {
      const messages = GUIDANCE_BY_CATEGORY[category] ?? DEFAULT_GUIDANCE;

      logger.info({ category, queryLength: trimmed.length }, 'compliance.anti_triche.blocked');

      return {
        allowed: false,
        category,
        refusalMessage: messages.refusal,
        guidanceMessage: messages.guidance,
      };
    }
  }

  return { allowed: true };
}

/**
 * Build a structured JSON refusal response for blocked requests.
 */
export function buildRefusalOutput(result: AntiTricheResult): Record<string, unknown> {
  return {
    blocked: true,
    category: result.category,
    message: result.refusalMessage,
    guidance: result.guidanceMessage,
    tip: 'Reformule ta demande pour obtenir de l\'aide méthodologique.',
  };
}
