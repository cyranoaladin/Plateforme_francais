import { EXTRAITS_OEUVRES } from '@/data/extraits-oeuvres';
import { prisma } from '@/lib/db/client';
import { orchestrate } from '@/lib/llm/orchestrator';
import { fallbackSkillOutput, parseSkillOutput } from '@/lib/llm/skills';
import { type Skill } from '@/lib/llm/skills/types';
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

function normalizeWorkKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/['’`]/g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function matchesWork(target: string, candidate: string): boolean {
  const normalizedTarget = normalizeWorkKey(target);
  const normalizedCandidate = normalizeWorkKey(candidate);
  return (
    normalizedTarget === normalizedCandidate ||
    normalizedTarget.includes(normalizedCandidate) ||
    normalizedCandidate.includes(normalizedTarget)
  );
}

function buildPhraseCandidate(text: string): string {
  return text
    .split(/[.!?]/)
    .find((chunk) => chunk.trim().length > 20)
    ?.trim() ?? text.trim();
}

function normalizePhaseEvaluation(phase: OralPhaseKey, skill: Skill, payload: unknown): PhaseEvaluation {
  try {
    const parsed = parseSkillOutput(skill, payload) as PhaseEvaluation;
    return {
      ...parsed,
      score: clampPhaseScore(phase, parsed.score),
      max: PHASE_MAX_SCORES[phase],
    };
  } catch (error) {
    logger.warn({ error, phase, skill }, 'oral.evaluatePhase.invalid_payload');
    const fallback = fallbackSkillOutput(skill) as PhaseEvaluation;
    return {
      ...fallback,
      score: clampPhaseScore(phase, fallback.score),
      max: PHASE_MAX_SCORES[phase],
    };
  }
}

/**
 * Pick an extrait based on the student's "Descriptif de lecture" for simulations.
 */
export async function pickOralExtrait(params: {
  oeuvre: string;
  userId: string;
  mode: 'SIMULATION' | 'FREE_PRACTICE';
}): Promise<{
  texte: string;
  questionGrammaire: string;
  phraseGrammaire: string;
}> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: params.userId },
    include: { descriptifTextes: true },
  });

  const descriptifTextes = profile?.descriptifTextes ?? [];

  const MIN_TEXTS_FOR_SIMULATION = 3;
  if (params.mode === 'SIMULATION' && descriptifTextes.length < MIN_TEXTS_FOR_SIMULATION) {
    logger.info(
      { userId: params.userId, count: descriptifTextes.length, oeuvre: params.oeuvre },
      'oral.pickExtrait.incomplete_descriptif — using corpus fallback',
    );
  }

  // First, try to find a match in the student's descriptif
  const studentMatch = descriptifTextes.find((t) =>
    t.typeExtrait === 'extrait_oeuvre' && matchesWork(params.oeuvre, t.oeuvre)
  );

  if (studentMatch?.premieresLignes?.trim()) {
    const texte = studentMatch.premieresLignes.trim();
    return {
      texte,
      questionGrammaire: `Analysez la construction d'une phrase significative tirée de « ${studentMatch.titre} ».`,
      phraseGrammaire: buildPhraseCandidate(texte) || 'Phrase cible indisponible.',
    };
  }

  // Fallback corpus interne si le descriptif élève ne contient pas encore d'extrait exploitable.
  const corpusMatch = EXTRAITS_OEUVRES.find((item) =>
    matchesWork(params.oeuvre, item.oeuvre)
  );

  if (corpusMatch) {
    return {
      texte: corpusMatch.extrait,
      questionGrammaire: corpusMatch.questionGrammaire,
      phraseGrammaire: buildPhraseCandidate(corpusMatch.extrait) || 'Phrase cible indisponible.',
    };
  }

  throw new Error(
    params.mode === 'SIMULATION' && descriptifTextes.length < MIN_TEXTS_FOR_SIMULATION
      ? `Descriptif incomplet et aucun extrait de secours disponible pour « ${params.oeuvre} ». Ajoute les premières lignes du texte dans ton descriptif ou choisis une œuvre prise en charge.`
      : `Aucun extrait exploitable n'a été trouvé pour « ${params.oeuvre} ». Ajoute les premières lignes du texte dans ton descriptif ou choisis une œuvre prise en charge.`
  );
}

/**
 * Evaluate a single oral phase transcript via the centralized Orchestrator (Skills).
 */
export async function evaluateOralPhase(input: {
  phase: OralPhaseKey;
  transcript: string;
  extrait: string;
  questionGrammaire: string;
  oeuvre: string;
  duration: number;
  userId: string;
  oeuvreChoisieEntretien?: string | null;
  examinerProfile?: string | null;
}): Promise<PhaseEvaluation> {
  const mapping: Record<OralPhaseKey, Skill> = {
    LECTURE: 'coach_lecture',
    EXPLICATION: 'coach_explication',
    GRAMMAIRE: 'grammaire_ciblee',
    ENTRETIEN: 'oral_entretien',
  };

  const skill = mapping[input.phase];

  try {
    const effectiveWorkId = input.phase === 'ENTRETIEN'
      ? (input.oeuvreChoisieEntretien ?? input.oeuvre)
      : input.oeuvre;

    const result = await orchestrate({
      skill,
      userId: input.userId,
      userQuery: input.transcript,
      workId: effectiveWorkId,
      context: `Œuvre: ${input.oeuvre}\nExtrait: ${input.extrait}\nQuestion: ${input.questionGrammaire}\nDurée: ${input.duration}s${input.phase === 'ENTRETIEN' ? `\n\nŒuvre choisie par l'élève: ${input.oeuvreChoisieEntretien ?? 'Non renseignée'}\nProfil examinateur: ${input.examinerProfile ?? 'NEUTRE'}` : ''}`,
    });

    return normalizePhaseEvaluation(input.phase, skill, result);
  } catch (error) {
    logger.error({ error, phase: input.phase }, 'oral.evaluatePhase.failed');
    return {
      feedback: 'Évaluation automatique indisponible.',
      score: 0,
      max: PHASE_MAX_SCORES[input.phase],
      points_forts: [],
      axes: ['Vérifiez votre connexion et recommencez.'],
    };
  }
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

  const phaseLabels: Record<OralPhaseKey, string> = {
    LECTURE: 'la lecture expressive',
    EXPLICATION: "l'explication linéaire",
    GRAMMAIRE: 'la question de grammaire',
    ENTRETIEN: "la fluidité de l'entretien",
  };
  const phaseThresholds: Record<OralPhaseKey, number> = {
    LECTURE: 1,
    EXPLICATION: 4,
    GRAMMAIRE: 1,
    ENTRETIEN: 4,
  };
  const weakPhases = (Object.keys(PHASE_MAX_SCORES) as OralPhaseKey[])
    .filter((k) => scored.phases[k].score < phaseThresholds[k])
    .sort((a, b) =>
      scored.phases[a].score / PHASE_MAX_SCORES[a] -
      scored.phases[b].score / PHASE_MAX_SCORES[b],
    )
    .map((k) => phaseLabels[k]);
  const top2 = weakPhases.slice(0, 2);

  let bilan_global: string;
  let conseil_final: string;

  if (note >= 16) {
    bilan_global =
      top2.length > 0
        ? `Excellente prestation orale avec ${note}/20 — maîtrise solide des 4 composantes, à l'exception de ${top2.join(' et ')} qui méritent encore de l'attention.`
        : `Excellente prestation orale avec ${note}/20 — maîtrise solide des 4 composantes. Quelques raffinements possibles dans la précision analytique.`;
    conseil_final =
      top2.length > 0
        ? `Affinez encore ${top2.join(' et ')} pour consolider votre niveau. Approfondissez ensuite les procédés stylistiques et variez les références intertextuelles.`
        : "Approfondissez les procédés stylistiques et variez les références intertextuelles pour viser l'excellence.";
  } else if (note >= 12) {
    bilan_global =
      top2.length > 0
        ? `Bonne prestation avec ${note}/20 — la structure est présente, la méthode doit se consolider. Axes prioritaires : ${top2.join(' et ')}.`
        : `Bonne prestation avec ${note}/20 — la structure est présente, la méthode doit se consolider.`;
    conseil_final =
      top2.length > 0
        ? `Concentrez-vous sur ${top2.join(' et ')}. Travaillez les transitions entre parties et enrichissez les citations textuelles.`
        : 'Travaillez les transitions entre parties et enrichissez les citations textuelles pour progresser.';
  } else if (note >= 8) {
    bilan_global =
      top2.length > 0
        ? `Prestation fragile avec ${note}/20 — des bases présentes mais une méthode à renforcer. Points à travailler en priorité : ${top2.join(' et ')}.`
        : `Prestation fragile avec ${note}/20 — des bases présentes mais une méthode à renforcer sur chaque composante.`;
    conseil_final =
      top2.length > 0
        ? `Priorité à ${top2.join(' et ')}. Reprenez les fiches méthode pour ces phases et entraînez-vous avec des extraits variés.`
        : 'Reprenez les fiches méthode pour chaque phase et entraînez-vous avec des extraits variés.';
  } else {
    bilan_global =
      top2.length > 0
        ? `Prestation insuffisante avec ${note}/20 — effort notable mais les fondamentaux sont à reprendre, en commençant par ${top2.join(' et ')}.`
        : `Prestation insuffisante avec ${note}/20 — effort notable mais les fondamentaux doivent être repris.`;
    conseil_final =
      top2.length > 0
        ? `Commencez impérativement par travailler ${top2[0]}${top2[1] ? ` et ${top2[1]}` : ''} avant de relancer une simulation complète.`
        : "Commencez par maîtriser la lecture expressive et la structure de l'explication linéaire.";
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
