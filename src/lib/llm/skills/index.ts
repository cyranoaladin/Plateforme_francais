import { z } from 'zod';
import { bibliothecaireSkill } from '@/lib/llm/skills/bibliothecaire';
import { coachEcritSkill } from '@/lib/llm/skills/coach-ecrit';
import { coachOralSkill } from '@/lib/llm/skills/coach-oral';
import { correcteurSkill } from '@/lib/llm/skills/correcteur';
import { quizMaitreSkill } from '@/lib/llm/skills/quiz-maitre';
import { tuteurLibreSkill } from '@/lib/llm/skills/tuteur-libre';
import { oralTirageSkill } from '@/lib/llm/skills/oral-tirage';
import { coachLectureSkill } from '@/lib/llm/skills/oral-coach-lecture';
import { coachExplicationSkill } from '@/lib/llm/skills/oral-coach-explication';
import { grammaireCibleeSkill } from '@/lib/llm/skills/oral-grammaire-ciblee';
import { oralEntretienSkill } from '@/lib/llm/skills/oral-entretien';
import { oralBilanOfficielSkill } from '@/lib/llm/skills/oral-bilan-officiel';
import { ecritDiagnosticSkill } from '@/lib/llm/skills/ecrit-diagnostic';
import { ecritPlansSkill } from '@/lib/llm/skills/ecrit-plans';
import { ecritContractionSkill } from '@/lib/llm/skills/ecrit-contraction';
import { ecritEssaiSkill } from '@/lib/llm/skills/ecrit-essai';
import { ecritLangueSkill } from '@/lib/llm/skills/ecrit-langue';
import { ecritBaremageSkill } from '@/lib/llm/skills/ecrit-baremage';
import { revisionFichesSkill } from '@/lib/llm/skills/revision-fiches';
import { quizAdaptatifSkill } from '@/lib/llm/skills/revision-quiz-adaptatif';
import { spacedRepetitionSkill } from '@/lib/llm/skills/revision-spaced-repetition';
import { oralPrep30Skill } from '@/lib/llm/skills/oral-prep30';
import { citationsProcedesSkill } from '@/lib/llm/skills/revision-citations-procedes';
import { carnetLectureSkill } from '@/lib/llm/skills/revision-carnet-lecture';
import { srPlannerSkill } from '@/lib/llm/skills/revision-sr-planner';
import { supportProduitSkill } from '@/lib/llm/skills/support-produit';
import { examinateurVirtuelSkill } from '@/lib/llm/skills/oral-examinateur-virtuel';
import { type Skill, type SkillConfig } from '@/lib/llm/skills/types';

export const skillConfigs: Record<Skill, SkillConfig<unknown>> = {
  bibliothecaire: bibliothecaireSkill,
  coach_ecrit: coachEcritSkill,
  coach_oral: coachOralSkill,
  correcteur: correcteurSkill,
  quiz_maitre: quizMaitreSkill,
  tuteur_libre: tuteurLibreSkill,
  oral_tirage: oralTirageSkill,
  coach_lecture: coachLectureSkill,
  coach_explication: coachExplicationSkill,
  grammaire_ciblee: grammaireCibleeSkill,
  oral_entretien: oralEntretienSkill,
  oral_bilan_officiel: oralBilanOfficielSkill,
  ecrit_diagnostic: ecritDiagnosticSkill,
  ecrit_plans: ecritPlansSkill,
  ecrit_contraction: ecritContractionSkill,
  ecrit_essai: ecritEssaiSkill,
  ecrit_langue: ecritLangueSkill,
  ecrit_baremage: ecritBaremageSkill,
  revision_fiches: revisionFichesSkill,
  quiz_adaptatif: quizAdaptatifSkill,
  spaced_repetition: spacedRepetitionSkill,
  oral_prep30: oralPrep30Skill,
  citations_procedes: citationsProcedesSkill,
  carnet_lecture: carnetLectureSkill,
  sr_planner: srPlannerSkill,
  support_produit: supportProduitSkill,
  examinateur_virtuel: examinateurVirtuelSkill,
};

export function parseSkillOutput(skill: Skill, payload: unknown): unknown {
  const config = skillConfigs[skill];
  return config.outputSchema.parse(payload);
}

export function fallbackSkillOutput(skill: Skill): unknown {
  return skillConfigs[skill].fallback;
}

export function skillSchemaFor(skill: Skill): z.ZodType<unknown> {
  return skillConfigs[skill].outputSchema;
}

export function skillPromptFor(skill: Skill): string {
  return skillConfigs[skill].prompt;
}
