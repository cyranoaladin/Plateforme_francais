/**
 * Onboarding Copy Analysis — Analyze student copies during onboarding.
 *
 * When a student uploads 1-3 copies during onboarding, this module:
 *   1. Runs OCR if the file is an image
 *   2. Detects the copy type (commentaire/dissertation/contraction)
 *   3. Runs Agent_DiagnosticEcrit for structured analysis
 *   4. Extracts WeakSkills and saves them to the student profile
 *
 * @module onboarding/copy-analysis
 */

import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { extractTextFromCopie } from '@/lib/correction/ocr';
import { orchestrate } from '@/lib/llm/orchestrator';
import { searchOfficialReferences } from '@/lib/rag/search';
import { logger } from '@/lib/logger';

export type CopyType = 'COMMENTAIRE' | 'DISSERTATION' | 'CONTRACTION' | 'ESSAI' | 'UNKNOWN';

export interface CopyAnalysisResult {
  copyType: CopyType;
  niveau: string;
  points_forts: string[];
  lacunes: string[];
  recommandations: string[];
  priorites: string[];
  rawAnalysis: unknown;
}

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

type EafSkillValue =
  | 'ORAL_LECTURE_FLUIDITE' | 'ORAL_LECTURE_EXPRESSIVITE'
  | 'ORAL_EXPLIC_MOUVEMENT' | 'ORAL_EXPLIC_ANALYSE' | 'ORAL_EXPLIC_CITATIONS' | 'ORAL_EXPLIC_OUVERTURE'
  | 'ORAL_GRAMM_IDENTIFICATION' | 'ORAL_GRAMM_ANALYSE'
  | 'ORAL_ENTRETIEN_CONNAISSANCE' | 'ORAL_ENTRETIEN_REACTIVITE' | 'ORAL_ENTRETIEN_CULTURE' | 'ORAL_ENTRETIEN_CRITIQUE'
  | 'ECRIT_COMMENT_PLAN' | 'ECRIT_COMMENT_ANALYSE' | 'ECRIT_COMMENT_CITATIONS'
  | 'ECRIT_DISSERT_THESE' | 'ECRIT_DISSERT_TRANSITION' | 'ECRIT_DISSERT_EXEMPLES'
  | 'TRANS_LANGUE_GRAMMAIRE' | 'TRANS_LANGUE_STYLE' | 'TRANS_LANGUE_SYNTAXE'
  | 'TRANS_TEMPS_GESTION' | 'TRANS_CULTURE_GENERALE';

/**
 * Keyword-to-EafSkill mapping for automatic classification of lacunes.
 */
const LACUNE_KEYWORD_MAP: Array<{ keywords: string[]; skill: EafSkillValue; category: string }> = [
  { keywords: ['plan', 'structure', 'organisation', 'cohérence'], skill: 'ECRIT_COMMENT_PLAN', category: 'ecrit' },
  { keywords: ['analyse', 'procédé', 'procédés', 'stylistique', 'littéraire'], skill: 'ECRIT_COMMENT_ANALYSE', category: 'ecrit' },
  { keywords: ['citation', 'citer', 'référence', 'texte'], skill: 'ECRIT_COMMENT_CITATIONS', category: 'ecrit' },
  { keywords: ['thèse', 'problématique', 'problématisation', 'argument'], skill: 'ECRIT_DISSERT_THESE', category: 'ecrit' },
  { keywords: ['transition', 'lien', 'connecteur', 'logique'], skill: 'ECRIT_DISSERT_TRANSITION', category: 'ecrit' },
  { keywords: ['exemple', 'illustration', 'preuve'], skill: 'ECRIT_DISSERT_EXEMPLES', category: 'ecrit' },
  { keywords: ['grammaire', 'syntaxe', 'accord', 'conjugaison', 'orthographe'], skill: 'TRANS_LANGUE_GRAMMAIRE', category: 'langue' },
  { keywords: ['style', 'expression', 'vocabulaire', 'registre', 'langue'], skill: 'TRANS_LANGUE_STYLE', category: 'langue' },
  { keywords: ['phrase', 'syntaxique', 'construction'], skill: 'TRANS_LANGUE_SYNTAXE', category: 'langue' },
  { keywords: ['temps', 'gestion', 'durée', 'timing'], skill: 'TRANS_TEMPS_GESTION', category: 'transversal' },
  { keywords: ['culture', 'intertextualité', 'contexte', 'historique'], skill: 'TRANS_CULTURE_GENERALE', category: 'transversal' },
  { keywords: ['oral', 'lecture', 'fluidité', 'lire'], skill: 'ORAL_LECTURE_FLUIDITE', category: 'oral' },
  { keywords: ['mouvement', 'découpage', 'partie'], skill: 'ORAL_EXPLIC_MOUVEMENT', category: 'oral' },
];

/**
 * Map free-text lacunes from LLM analysis to EafSkill enum values.
 * Falls back to TRANS_LANGUE_STYLE for unmatched lacunes.
 */
function mapLacunesToEafSkills(
  lacunes: string[],
  copyType: CopyType,
): Array<{ skill: EafSkillValue; pattern: string; category: string }> {
  const usedSkills = new Set<EafSkillValue>();
  const results: Array<{ skill: EafSkillValue; pattern: string; category: string }> = [];

  for (const lacune of lacunes) {
    const lower = lacune.toLowerCase();
    let matched = false;

    for (const mapping of LACUNE_KEYWORD_MAP) {
      if (usedSkills.has(mapping.skill)) continue;
      if (mapping.keywords.some((kw) => lower.includes(kw))) {
        results.push({ skill: mapping.skill, pattern: lacune.slice(0, 200), category: mapping.category });
        usedSkills.add(mapping.skill);
        matched = true;
        break;
      }
    }

    if (!matched) {
      const fallback: EafSkillValue =
        copyType === 'COMMENTAIRE' ? 'ECRIT_COMMENT_ANALYSE'
        : copyType === 'DISSERTATION' ? 'ECRIT_DISSERT_THESE'
        : 'TRANS_LANGUE_STYLE';
      if (!usedSkills.has(fallback)) {
        results.push({ skill: fallback, pattern: lacune.slice(0, 200), category: 'ecrit' });
        usedSkills.add(fallback);
      }
    }
  }

  return results;
}

/**
 * Detect copy type from the text content using simple heuristics.
 */
function detectCopyType(text: string): CopyType {
  const lower = text.toLowerCase();

  if (lower.includes('commentaire') || lower.includes('explication linéaire') || lower.includes('analyse du texte')) {
    return 'COMMENTAIRE';
  }
  if (lower.includes('dissertation') || lower.includes('problématique') || lower.includes('thèse')) {
    return 'DISSERTATION';
  }
  if (lower.includes('contraction') || lower.includes('résumé')) {
    return 'CONTRACTION';
  }
  if (lower.includes('essai') || lower.includes('argumentation')) {
    return 'ESSAI';
  }

  const wordCount = text.split(/\s+/).length;
  if (wordCount > 400) {
    return 'DISSERTATION';
  }
  if (wordCount > 150) {
    return 'COMMENTAIRE';
  }

  return 'UNKNOWN';
}

/**
 * Analyze a single copy submitted during onboarding.
 *
 * @param copyText - The text content of the copy (already OCR'd if needed).
 * @param userId - The student's user ID.
 * @returns Structured analysis with detected weaknesses.
 */
export async function analyzeOnboardingCopy(
  copyText: string,
  userId: string,
): Promise<CopyAnalysisResult> {
  const copyType = detectCopyType(copyText);

  let ragContext = '';
  try {
    const ragResults = await searchOfficialReferences(
      `barème ${copyType} EAF rapports jury critères notation`,
      5,
    );
    ragContext = ragResults
      .map((r) => `[${r.title}] ${r.excerpt}`)
      .join('\n\n');
  } catch {
    logger.warn({ userId }, 'onboarding.copy_analysis.rag_unavailable');
  }

  const truncatedCopy = copyText.slice(0, 4000);

  try {
    const analysis = await orchestrate({
      skill: 'ecrit_diagnostic',
      userQuery: `Analyse cette copie de ${copyType} soumise pendant l'onboarding. Identifie le niveau, les forces et les faiblesses :\n\n${truncatedCopy}`,
      context: ragContext,
      userId,
    });

    const result = analysis as {
      niveau?: string;
      points_forts?: string[];
      lacunes?: string[];
      recommandations?: string[];
      priorites?: string[];
    };

    return {
      copyType,
      niveau: result.niveau ?? 'Non évalué',
      points_forts: result.points_forts ?? [],
      lacunes: result.lacunes ?? [],
      recommandations: result.recommandations ?? [],
      priorites: result.priorites ?? [],
      rawAnalysis: analysis,
    };
  } catch (error) {
    logger.error({ userId, error }, 'onboarding.copy_analysis.orchestrate_failed');
    return {
      copyType,
      niveau: 'Non évalué',
      points_forts: [],
      lacunes: ['Analyse automatique indisponible — réessayez plus tard.'],
      recommandations: [],
      priorites: ['Structuration', 'Argumentation', 'Langue'],
      rawAnalysis: null,
    };
  }
}

/**
 * Process a file uploaded during onboarding:
 * 1. Run OCR if image
 * 2. Analyze with Agent_DiagnosticEcrit
 * 3. Save initial WeakSkills to profile
 *
 * @param filePath - Absolute path to the uploaded file.
 * @param mimeType - MIME type of the uploaded file.
 * @param userId - Student's user ID.
 * @param profileId - Student's profile ID (for WeakSkill storage).
 */
export async function processOnboardingCopy(
  filePath: string,
  mimeType: string,
  userId: string,
  profileId: string,
): Promise<CopyAnalysisResult> {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  const isImage = IMAGE_EXTENSIONS.has(ext) || mimeType.startsWith('image/');

  let copyText: string;

  if (isImage || mimeType === 'application/pdf') {
    copyText = await extractTextFromCopie({ absolutePath: filePath, mimeType });
    if (copyText.startsWith('[ocr indisponible')) {
      logger.warn({ filePath, userId }, 'onboarding.copy_analysis.ocr_failed');
      return {
        copyType: 'UNKNOWN',
        niveau: 'Non évalué',
        points_forts: [],
        lacunes: ['La copie n\'a pas pu être lue. Essayez avec un scan de meilleure qualité.'],
        recommandations: [],
        priorites: [],
        rawAnalysis: null,
      };
    }
  } else {
    const { promises: fs } = await import('fs');
    copyText = await fs.readFile(filePath, 'utf-8');
  }

  const analysis = await analyzeOnboardingCopy(copyText, userId);

  if (await isDatabaseAvailable()) {
    try {
      const mappedSkills = mapLacunesToEafSkills(analysis.lacunes, analysis.copyType);

      for (let i = 0; i < mappedSkills.length; i++) {
        const mapped = mappedSkills[i];
        if (!mapped) continue;
        await prisma.weakSkillEntry.create({
          data: {
            profileId,
            skill: mapped.skill,
            pattern: mapped.pattern,
            category: mapped.category,
            severity: i === 0 ? 'HIGH' : i === 1 ? 'MEDIUM' : 'LOW',
          },
        });
      }

      logger.info(
        { userId, weakSkills: mappedSkills.length },
        'onboarding.copy_analysis.weak_skills_saved',
      );
    } catch (error) {
      logger.error({ userId, error }, 'onboarding.copy_analysis.weak_skills_save_error');
    }
  }

  return analysis;
}

/**
 * Run a mini diagnostic exercise when the student has no copy to upload.
 * Provides a short text and asks the student to write 10 lines of analysis.
 */
export function getMiniDiagnosticExercise(): {
  texte: string;
  consigne: string;
} {
  return {
    texte: `« Il n'est pas nécessaire d'espérer pour entreprendre ni de réussir pour persévérer. »
— Guillaume d'Orange

Ce texte bref mais riche soulève la question de la persévérance face à l'incertitude.`,
    consigne: `Écris 10 lignes d'analyse de cette citation. Identifie le procédé stylistique principal et explique l'effet produit. Cette analyse nous aidera à évaluer ton niveau initial.`,
  };
}
