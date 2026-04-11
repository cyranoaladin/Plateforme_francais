import { z } from 'zod';
import { logger } from '@/lib/logger';

// H1 FIX: Patterns enrichis avec variations sémantiques pour détecter les contournements
export const FORBIDDEN_PATTERNS = [
  // Rédaction complète - formulations directes
  { pattern: /r[ée]dige[sz]?\s+(moi\s+)?(un[e]?\s+)?(dissertation|commentaire|contraction|essai|explication)/i, category: 'redaction_complete' },
  { pattern: /[ée]cri[st]?\s+(moi\s+)?(un[e]?\s+)?(dissertation|commentaire|contraction|essai|introduction|conclusion)/i, category: 'redaction_complete' },
  { pattern: /fai[st]?\s+(moi\s+)?(un[e]?\s+)?(dissertation|commentaire|contraction|essai)/i, category: 'redaction_complete' },
  // H1: Variations sémantiques (contournements)
  { pattern: /aide[sz]?[- ]?(moi\s+)?[àa]\s+(d[ée]velopper|[ée]crire|r[ée]diger)\s+(tout\s+)?(le\s+)?(texte|devoir|dissertation)/i, category: 'redaction_complete' },
  { pattern: /(d[ée]veloppe|explique)[sz]?[- ]?(moi\s+)?(tout\s+)?(le\s+)?(sujet|th[èe]me|texte)\s+(enti[èe]rement|compl[èe]tement|en\s+entier)/i, category: 'redaction_complete' },
  { pattern: /(pr[ée]pare|con[çc]ois)[sz]?[- ]?(moi\s+)?(la\s+)?(r[ée]ponse|copie)\s+finale/i, category: 'redaction_complete' },
  { pattern: /montre[sz]?[- ]?(moi\s+)?comment\s+(on\s+)?fait\s+(un[e]?\s+)?(dissertation|devoir)\s+exemple/i, category: 'redaction_complete' },
  { pattern: /donne[sz]?[- ]?(moi\s+)?un\s+mod[èe]le\s+de\s+(dissertation|r[ée]ponse|copie)/i, category: 'copie_complete' },
  { pattern: /(r[ée]dige|construis)[sz]?\s+pour\s+moi/i, category: 'redaction_complete' },
  { pattern: /(aide|assiste)[sz]?[- ]?moi\s+[àa]\s+faire\s+(mon|le|ce)\s+devoir/i, category: 'substitution' },
  // Copie complète
  { pattern: /donne[sz]?[\s-]+(moi\s+)?(un[e]?\s+)?(copie|r[ée]daction|corrig[ée])\s+(compl[èe]te|enti[èe]re|int[ée]grale)/i, category: 'copie_complete' },
  { pattern: /corrig[ée]\s+type\s+(complet|int[ée]gral)/i, category: 'copie_complete' },
  // Substitution / triche
  { pattern: /r[ée]pon[ds]+\s+[àa]\s+ma\s+place/i, category: 'substitution' },
  { pattern: /fai[st]?\s+(le|mon)\s+(devoir|travail)\s+[àa]\s+ma\s+place/i, category: 'substitution' },
  { pattern: /g[ée]n[èe]re\s+(un[e]?\s+)?(copie|r[ée]daction)\s+(compl[èe]te|pr[êe]te)/i, category: 'copie_complete' },
  { pattern: /fai[st]?\s+l'explication\s+lin[ée]aire/i, category: 'redaction_complete' },
  { pattern: /donne[sz]?[\s-]+(moi\s+)?(le\s+)?plan\s+complet\s+avec\s+(introduction|conclusion)/i, category: 'copie_complete' },
  { pattern: /quel\s+est\s+le\s+corrig[ée]\s+de/i, category: 'copie_complete' },
  { pattern: /passe[sz]?\s+(mon\s+)?oral\s+[àa]\s+ma\s+place/i, category: 'substitution' },
  { pattern: /simule[sz]?\s+(ma\s+)?r[ée]ponse\s+compl[èe]te/i, category: 'substitution' },
  { pattern: /r[ée]sou[dst]?\s+(l'exercice|la\s+question)\s+de\s+grammaire\s+[àa]\s+ma\s+place/i, category: 'substitution' },
  { pattern: /fai[st]?\s+l['']analyse\s+compl[èe]te/i, category: 'redaction_complete' },
  { pattern: /r[ée]pon[ds]+\s+(enti[èe]rement|int[ée]gralement)\s+[àa]\s+(cette|ma)\s+question/i, category: 'redaction_complete' },
  { pattern: /donne[sz]?[- ]+(moi\s+)?(un[e]?\s+)?r[ée]ponse\s+compl[èe]te/i, category: 'copie_complete' },
  { pattern: /[ée]cri[st]?\s+(l['']introduction\s+et\s+(le\s+)?d[ée]veloppement|tout\s+(le\s+)?devoir)/i, category: 'redaction_complete' },
  { pattern: /g[ée]n[èe]re?\s+(mon|le)\s+plan\s+(complet|int[ée]gral|d[ée]taill[ée])/i, category: 'copie_complete' },
  { pattern: /quell?e[sz]?\s+sont\s+les?\s+r[ée]ponses?\s+[àa]\s+(donner|[ée]crire)/i, category: 'substitution' },
];

export const antiTricheResultSchema = z.object({
  allowed: z.boolean(),
  category: z.string().optional(),
  refusalMessage: z.string().optional(),
  guidanceMessage: z.string().optional(),
});

export type AntiTricheResult = z.infer<typeof antiTricheResultSchema>;

const GUIDANCE_BY_CATEGORY = {
  redaction_complete: {
    refusal: 'Je ne peux pas rédiger un texte complet à ta place — ce serait de la triche et ça ne t\u2019aiderait pas à progresser.',
    guidance: 'En revanche, je peux t\u2019aider à : (1) construire un plan détaillé, (2) formuler une problématique, (3) rédiger une phrase d\u2019amorce, (4) analyser un procédé stylistique, (5) te donner un feedback sur un paragraphe que tu as écrit.',
  },
  copie_complete: {
    refusal: 'Fournir une copie complète ou un corrigé intégral n\u2019est pas autorisé — l\u2019objectif est que tu construises toi-même ta réponse.',
    guidance: 'Je peux te proposer : (1) une méthodologie pas-à-pas, (2) des exemples de transitions, (3) une analyse de tes points forts et axes d\u2019amélioration, (4) des citations pertinentes à exploiter.',
  },
  substitution: {
    refusal: 'Je ne peux pas faire ton travail à ta place — mon rôle est de t\u2019accompagner, pas de te remplacer.',
    guidance: 'Commence par écrire une première version, même imparfaite. Je t\u2019aiderai ensuite à l\u2019améliorer avec des conseils ciblés, des corrections de langue et des pistes d\u2019approfondissement.',
  },
};

const DEFAULT_GUIDANCE = {
  refusal: 'Cette demande n\u2019est pas compatible avec l\u2019accompagnement pédagogique de la plateforme.',
  guidance: 'Reformule ta question pour demander de l\u2019aide méthodologique, un feedback sur ton travail, ou des pistes d\u2019amélioration.',
};

export function classifyAntiTriche(userQuery: string | undefined | null): AntiTricheResult {
  if (!userQuery || typeof userQuery !== 'string') return { allowed: true };
  const trimmed = userQuery.trim();
  if (trimmed.length === 0) return { allowed: true };

  for (const { pattern, category } of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) {
      const messages = GUIDANCE_BY_CATEGORY[category as keyof typeof GUIDANCE_BY_CATEGORY] || DEFAULT_GUIDANCE;
      logger.info({ category, queryLength: trimmed.length }, 'compliance.anti_triche.blocked_input');
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

export function validateLlmOutput(output: string | undefined | null, mode: 'entrainement' | 'examen' = 'examen'): AntiTricheResult {
  if (!output || typeof output !== 'string') return { allowed: true };
  const wordCount = output.split(/\s+/).length;
  const hasEssayStructure = /introduction|développement|conclusion|première partie|transition/i.test(output);

  if (wordCount > 180 && hasEssayStructure && mode === 'examen') {
    const messages = GUIDANCE_BY_CATEGORY.redaction_complete;
    logger.warn({ wordCount, hasEssayStructure }, 'compliance.anti_triche.blocked_output');
    return {
      allowed: false,
      category: 'redaction_complete',
      refusalMessage: messages.refusal,
      guidanceMessage: messages.guidance,
    };
  }
  return { allowed: true };
}

export function buildRefusalOutput(result: AntiTricheResult): Record<string, unknown> {
  return {
    blocked: true,
    category: result.category,
    message: result.refusalMessage,
    guidance: result.guidanceMessage,
    tip: 'Reformule ta demande pour obtenir de l\u2019aide méthodologique.',
  };
}
