import { EXTRAITS_OEUVRES } from '@/data/extraits-oeuvres';
import { prisma } from '@/lib/db/client';
import { orchestrate } from '@/lib/llm/orchestrator';
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

  if (!profile) {
    throw new Error('Profil étudiant introuvable.');
  }

  // Simulation: must have at least 20 texts in the descriptif
  if (params.mode === 'SIMULATION' && profile.descriptifTextes.length < 20) {
    throw new Error('Descriptif incomplet: 20 textes requis pour lancer une simulation.');
  }

  console.log(`[pickOralExtrait] User: ${params.userId}, Oeuvre: ${params.oeuvre}, Mode: ${params.mode}`);
  console.log(`[pickOralExtrait] Found ${profile.descriptifTextes.length} texts in descriptif.`);

  const studentList = profile.descriptifTextes.filter((t) =>
    params.oeuvre.toLowerCase().includes(t.oeuvre.toLowerCase())
  );
  console.log(`[pickOralExtrait] Filtered student list: ${studentList.length} matches for "${params.oeuvre}"`);

  // If we found specific texts in the student's list for this oeuvre, use them
  // Otherwise, fallback to the corpus for both modes (simulation and free practice)
  let pool = studentList.length > 0 ? studentList : EXTRAITS_OEUVRES;
  
  // If still no texts found for this specific oeuvre, try to find any text from the corpus
  if (pool.length === 0 || (studentList.length === 0 && pool === EXTRAITS_OEUVRES)) {
    // Try to find a match in the corpus for the requested oeuvre
    const corpusMatch = EXTRAITS_OEUVRES.find((item) =>
      params.oeuvre.toLowerCase().includes(item.oeuvre.toLowerCase()) ||
      item.oeuvre.toLowerCase().includes(params.oeuvre.toLowerCase())
    );
    
    if (corpusMatch) {
      pool = [corpusMatch];
    } else {
      // Last resort: use any available extract
      pool = EXTRAITS_OEUVRES;
    }
  }

  if (pool.length === 0) {
    console.error(`[pickOralExtrait] ERROR: No texts found for "${params.oeuvre}" in simulation mode.`);
    throw new Error(`Aucun texte trouvé dans votre descriptif pour l'œuvre "${params.oeuvre}".`);
  }

  const choice = pool[Math.floor(Math.random() * pool.length)];
  console.log(`[pickOralExtrait] Picked: ${'titre' in choice ? choice.titre : choice.id}`);

  // Resolve full content from corpus based on title/oeuvre if it's a student reference
  const corpusMatch = EXTRAITS_OEUVRES.find((item) =>
    item.oeuvre.toLowerCase().includes(params.oeuvre.toLowerCase()) ||
    params.oeuvre.toLowerCase().includes(item.oeuvre.toLowerCase())
  ) ?? EXTRAITS_OEUVRES[0];

  console.log(`[pickOralExtrait] Corpus match: ${corpusMatch?.oeuvre}`);

  return {
    texte: corpusMatch?.extrait ?? 'Texte indisponible.',
    questionGrammaire: corpusMatch?.questionGrammaire ?? 'Analysez la syntaxe de la phrase.',
    phraseGrammaire: (corpusMatch?.extrait ?? '').split('.').find((chunk) => chunk.trim().length > 20)?.trim() ?? 'Phrase cible indisponible.',
  };
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
}): Promise<PhaseEvaluation> {
  const mapping: Record<OralPhaseKey, Skill> = {
    LECTURE: 'coach_lecture',
    EXPLICATION: 'coach_explication',
    GRAMMAIRE: 'grammaire_ciblee',
    ENTRETIEN: 'oral_entretien',
  };

  const skill = mapping[input.phase];

  try {
    const result = await orchestrate({
      skill,
      userId: input.userId,
      userQuery: input.transcript,
      context: `Œuvre: ${input.oeuvre}\nExtrait: ${input.extrait}\nQuestion: ${input.questionGrammaire}\nDurée: ${input.duration}s${input.phase === 'ENTRETIEN' ? `\n\nŒuvre choisie par l'élève: ${input.oeuvreChoisieEntretien ?? 'Non renseignée'}` : ''}`,
    }) as PhaseEvaluation;

    return {
      ...result,
      score: clampPhaseScore(input.phase, result.score),
      max: PHASE_MAX_SCORES[input.phase],
    };
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
