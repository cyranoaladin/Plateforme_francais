import { EXTRAITS_OEUVRES } from '@/data/extraits-oeuvres';
import { getRouterProvider } from '@/lib/llm/factory';
import { estimateTokens } from '@/lib/llm/token-estimate';
import type { ProviderChatMessage } from '@/lib/llm/provider';
import { logger } from '@/lib/logger';
import {
  computeOralScore,
  computeMention,
  clampPhaseScore,
  PHASE_MAX_SCORES,
  type OralPhaseKey,
  type PhaseScoreInput,
} from '@/lib/oral/scoring';

/** Standard citation format for RAG-sourced references. */
export type Citation = {
  title: string;
  source_interne: string;
  snippet: string;
};

/** Result of evaluating a single oral phase via LLM. */
export type PhaseEvaluation = {
  feedback: string;
  score: number;
  max: number;
  points_forts: string[];
  axes: string[];
  relance?: string;
  citations?: Citation[];
};

/** Full bilan result for a completed oral session (4 phases, /20). */
export type OralSessionResult = {
  note: number;
  maxNote: number;
  mention: string;
  phases: {
    lecture: { note: number; max: number; commentaire: string };
    explication: { note: number; max: number; commentaire: string };
    grammaire: { note: number; max: number; commentaire: string };
    entretien: { note: number; max: number; commentaire: string };
  };
  bilan_global: string;
  conseil_final: string;
  citations?: Citation[];
};

/**
 * Pick a random extrait for the given oeuvre from the corpus.
 */
export function pickOralExtrait(oeuvre: string): {
  texte: string;
  questionGrammaire: string;
} {
  const candidates = EXTRAITS_OEUVRES.filter((item) =>
    item.oeuvre.toLowerCase().includes(oeuvre.toLowerCase()),
  );

  const pool = candidates.length > 0 ? candidates : EXTRAITS_OEUVRES;
  const index = Math.floor(Math.random() * pool.length);
  const choice = pool[index] ?? pool[0];

  return {
    texte: choice?.extrait ?? 'Aucun extrait disponible.',
    questionGrammaire: choice?.questionGrammaire ?? 'Analysez la syntaxe de la phrase.',
  };
}

/**
 * Evaluate a single oral phase transcript via LLM.
 * The AI proposes a score; we clamp it to the official max.
 */
export async function evaluateOralPhase(input: {
  phase: OralPhaseKey;
  transcript: string;
  extrait: string;
  questionGrammaire: string;
  oeuvre: string;
  duration: number;
  oeuvreChoisieEntretien?: string | null;
}): Promise<PhaseEvaluation> {
  const max = PHASE_MAX_SCORES[input.phase];
  const messages: ProviderChatMessage[] = [
    {
      role: 'system',
      content: `Tu es examinateur EAF. Évalue la prestation de l'élève pour la phase "${input.phase}" (max ${max} points).
Barème officiel: Lecture /2, Explication /8, Grammaire /2, Entretien /8 (total /20).
Réponds UNIQUEMENT en JSON valide :
{
  "feedback": "<commentaire détaillé>",
  "score": <0-${max}>,
  "max": ${max},
  "points_forts": ["<point>", ...],
  "axes": ["<axe d'amélioration>", ...],
  "relance": "<question de relance optionnelle pour l'entretien>"
}
IMPORTANT: Le score DOIT être compris entre 0 et ${max}. Ne jamais fournir de rédaction complète.`,
    },
    {
      role: 'user',
      content: `Phase: ${input.phase}\nDurée: ${input.duration}s\nŒuvre: ${input.oeuvre}\nExtrait: ${input.extrait}\nQuestion grammaire: ${input.questionGrammaire}\n\nTranscription de l'élève:\n${input.transcript}${input.phase === 'ENTRETIEN' ? (input.oeuvreChoisieEntretien ? `\n\n⚠️ ENTRETIEN (2e partie) : L'élève présente son œuvre choisie : "${input.oeuvreChoisieEntretien}". Posez des questions sur cette œuvre : thèmes, personnages, structure, intérêt personnel, liens avec le parcours. NE PAS questionner sur l'extrait tiré pour cette phase.` : "\n\n⚠️ ENTRETIEN : L'élève n'a pas encore renseigné son œuvre choisie. Invitez-le à la renseigner dans son profil, puis évaluez sa réactivité culturelle générale.") : ''}`,
    },
  ];

  try {
    const provider = getRouterProvider('coach_oral', estimateTokens(messages));
    const response = await provider.generateContent(messages, {
      temperature: 0.2,
      responseMimeType: 'application/json',
      maxTokens: 600,
    });

    const raw = (response.content ?? response.text ?? '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as PhaseEvaluation;
      return {
        ...parsed,
        score: clampPhaseScore(input.phase, parsed.score),
        max,
      };
    }
  } catch (error) {
    logger.warn({ error, phase: input.phase }, 'oral.evaluatePhase.failed');
  }

  return {
    feedback: 'Évaluation automatique — réessayez avec un transcript plus précis.',
    score: 0,
    max,
    points_forts: [],
    axes: ['Structurer davantage la réponse.'],
  };
}

/**
 * Generate the final structured bilan from per-phase scores.
 * Uses computeOralScore() for official 2/8/2/8 totals.
 */
export async function generateOralBilan(phaseInputs: PhaseScoreInput[], phaseDetails: Record<string, { feedback: string }>): Promise<OralSessionResult> {
  const scored = computeOralScore(phaseInputs);

  const getComment = (phase: string): string =>
    phaseDetails[phase]?.feedback ?? 'Évaluation automatique.';

  const note = scored.total;
  const mention = computeMention(note);

  let bilan_global: string;
  let conseil_final: string;

  if (note >= 16) {
    bilan_global = 'Excellente prestation orale — maîtrise solide des 4 composantes. Quelques raffinements possibles dans la précision analytique.';
    conseil_final = 'Approfondissez les procédés stylistiques et variez les références intertextuelles.';
  } else if (note >= 12) {
    bilan_global = 'Bonne prestation avec des axes de progression identifiés. La structure est présente, la méthode doit se consolider.';
    conseil_final = 'Travaillez les transitions entre parties et enrichissez les citations textuelles.';
  } else if (note >= 8) {
    bilan_global = 'Prestation fragile — des bases présentes mais une méthode à renforcer sur chaque composante.';
    conseil_final = 'Reprenez les fiches méthode pour chaque phase et entraînez-vous avec des extraits variés.';
  } else {
    bilan_global = 'Prestation insuffisante — effort notable mais les fondamentaux doivent être repris.';
    conseil_final = 'Commencez par maîtriser la lecture expressive et la structure de l\'explication linéaire.';
  }

  return {
    note,
    maxNote: scored.maxTotal,
    mention,
    phases: {
      lecture: { note: scored.phases.LECTURE.score, max: scored.phases.LECTURE.max, commentaire: getComment('LECTURE') },
      explication: { note: scored.phases.EXPLICATION.score, max: scored.phases.EXPLICATION.max, commentaire: getComment('EXPLICATION') },
      grammaire: { note: scored.phases.GRAMMAIRE.score, max: scored.phases.GRAMMAIRE.max, commentaire: getComment('GRAMMAIRE') },
      entretien: { note: scored.phases.ENTRETIEN.score, max: scored.phases.ENTRETIEN.max, commentaire: getComment('ENTRETIEN') },
    },
    bilan_global,
    conseil_final,
  };
}
