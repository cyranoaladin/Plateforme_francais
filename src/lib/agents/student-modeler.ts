/**
 * StudentModeler Agent (P0-2) — updates SkillMap + evidence after EVERY interaction.
 * Called by all API endpoints that produce evaluative data.
 */

import { updateSkillMap, addErrorBankItem, getOrCreateSkillMap } from "@/lib/store/premium-store";
import type {
  SkillMap,
  RubricResult,
  ErrorType,
  SkillAxis,
} from "@/lib/types/premium";

export type InteractionEvent = {
  studentId: string;
  interactionId: string;
  agent: string;
  rubric?: RubricResult;
  detectedErrors?: Array<{
    errorType: ErrorType;
    category: SkillAxis;
    microSkillId: string;
    example: string;
    correction: string;
  }>;
  skillDeltas?: Array<{
    microSkillId: string;
    scoreDelta: number;
    evidence: string;
  }>;
};

/**
 * Rubric criterion ID → microSkill ID mapping.
 */
const CRITERION_TO_MICRO: Record<string, string> = {
  problematique: "ecrit_problematique",
  problematisation: "ecrit_problematique",
  plan: "ecrit_plan",
  citations: "ecrit_citations",
  expression: "ecrit_expression",
  transitions: "ecrit_transitions",
  conclusion: "ecrit_conclusion",
  lecture: "oral_lecture",
  explication: "oral_mouvements",
  grammaire: "oral_grammaire",
  entretien: "oral_entretien",
};

/**
 * Process an interaction event and update the student model.
 * Returns the updated SkillMap.
 */
export async function processInteraction(
  event: InteractionEvent
): Promise<SkillMap> {
  const updates: Array<{ microSkillId: string; score: number; evidence?: string }> = [];

  // 1. Extract skill updates from rubric
  if (event.rubric) {
    for (const criterion of event.rubric.criteria) {
      const microSkillId = CRITERION_TO_MICRO[criterion.id] || criterion.id;
      const normalizedScore = criterion.max > 0 ? criterion.score / criterion.max : 0;
      updates.push({
        microSkillId,
        score: normalizedScore,
        evidence: `[${event.agent}] ${criterion.evidence || criterion.label}: ${criterion.score}/${criterion.max}`,
      });
    }
  }

  // 2. Apply explicit skill deltas
  if (event.skillDeltas) {
    for (const delta of event.skillDeltas) {
      updates.push({
        microSkillId: delta.microSkillId,
        score: Math.max(0, Math.min(1, delta.scoreDelta)),
        evidence: `[${event.agent}] ${delta.evidence}`,
      });
    }
  }

  // 3. Persist detected errors to ErrorBank
  if (event.detectedErrors) {
    for (const err of event.detectedErrors) {
      await addErrorBankItem({
        studentId: event.studentId,
        errorType: err.errorType,
        category: err.category,
        microSkillId: err.microSkillId,
        example: err.example,
        correction: err.correction,
        sourceInteractionId: event.interactionId,
        sourceAgent: event.agent,
      });
    }
  }

  // 4. Update SkillMap
  if (updates.length > 0) {
    return updateSkillMap(event.studentId, updates);
  }

  // No updates — return current map
  return getOrCreateSkillMap(event.studentId);
}

/**
 * Extract typed errors from a rubric result.
 * Criteria scoring below 50% threshold are flagged as errors.
 */
export function extractErrorsFromRubric(
  rubric: RubricResult,
  agent: string
): Array<{
  errorType: ErrorType;
  category: SkillAxis;
  microSkillId: string;
  example: string;
  correction: string;
}> {
  const errors: Array<{
    errorType: ErrorType;
    category: SkillAxis;
    microSkillId: string;
    example: string;
    correction: string;
  }> = [];

  const ERROR_TYPE_MAP: Record<string, ErrorType> = {
    problematique: "problematique_floue",
    plan: "plan_desequilibre",
    citations: "citation_absente",
    expression: "syntaxe_erreur",
    transitions: "transition_absente",
    conclusion: "hors_sujet",
    lecture: "lecture_monotone",
    explication: "procede_mal_nomme",
    grammaire: "grammaire_erreur",
    entretien: "entretien_superficiel",
  };

  const CATEGORY_MAP: Record<string, SkillAxis> = {
    problematique: "ecrit",
    plan: "ecrit",
    citations: "ecrit",
    expression: "langue",
    transitions: "ecrit",
    conclusion: "ecrit",
    lecture: "oral",
    explication: "oral",
    grammaire: "langue",
    entretien: "oral",
  };

  for (const criterion of rubric.criteria) {
    const ratio = criterion.max > 0 ? criterion.score / criterion.max : 1;
    if (ratio < 0.5) {
      const microSkillId = CRITERION_TO_MICRO[criterion.id] || criterion.id;
      errors.push({
        errorType: ERROR_TYPE_MAP[criterion.id] || "autre",
        category: CATEGORY_MAP[criterion.id] || "methode",
        microSkillId,
        example: criterion.evidence || `[${agent}] ${criterion.label}: ${criterion.score}/${criterion.max}`,
        correction: `Objectif : améliorer ${criterion.label} au-dessus de ${Math.ceil(criterion.max * 0.5)}/${criterion.max}`,
      });
    }
  }

  return errors;
}
