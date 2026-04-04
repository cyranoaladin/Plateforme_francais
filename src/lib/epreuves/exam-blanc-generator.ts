/**
 * DIFF-03 — Exam Blanc Generator
 * Generates a full EAF mock exam (écrit or oral) with official constraints.
 * Uses orchestrator with coach_ecrit skill for subject generation.
 */

import { orchestrate } from '@/lib/llm/orchestrator';
import { logger } from '@/lib/logger';

export type ExamType = 'commentaire' | 'dissertation' | 'contraction_essai';

export type ExamBlancSubject = {
  type: ExamType;
  sujet: string;
  texte: string;
  consignes: string;
  duree: string;
  bareme: Record<string, number>;
  generatedAt: string;
};

export type ExamBlancConfig = {
  type: ExamType;
  oeuvre?: string;
  theme?: string;
  userId: string;
};

/**
 * Generate a full EAF mock exam subject.
 * Throws if the LLM fails or returns incomplete data.
 */
export async function generateExamBlanc(config: ExamBlancConfig): Promise<ExamBlancSubject> {
  const dureeMap: Record<ExamType, string> = {
    commentaire: '4h',
    dissertation: '4h',
    contraction_essai: '4h (contraction 1h + essai 3h)',
  };

  let result: unknown;
  try {
    result = await orchestrate({
      skill: 'coach_ecrit',
      userId: config.userId,
      workId: config.oeuvre,
      userQuery: buildExamPrompt(config),
      context: `Type: ${config.type}. Durée officielle: ${dureeMap[config.type]}.`,
    });
  } catch (err) {
    logger.error({ err, config }, 'exam_blanc.generation_failed');
    throw new Error('La génération du sujet d\u2019examen blanc est temporairement indisponible. Réessayez dans quelques instants.');
  }

  const output = result as {
    sujet?: string;
    texte?: string;
    consignes?: string;
    bareme?: Record<string, number>;
  };

  if (!output.sujet || !output.texte) {
    logger.error({ output, config }, 'exam_blanc.incomplete_output');
    throw new Error('Le générateur n\u2019a pas produit un sujet complet. Réessayez.');
  }

  return {
    type: config.type,
    sujet: output.sujet,
    texte: output.texte,
    consignes: output.consignes ?? `Durée: ${dureeMap[config.type]}. Respectez le barème officiel.`,
    duree: dureeMap[config.type],
    bareme: output.bareme ?? getDefaultBareme(config.type),
    generatedAt: new Date().toISOString(),
  };
}

function buildExamPrompt(config: ExamBlancConfig): string {
  const parts = [`Génère un sujet d'examen blanc EAF de type ${config.type}.`];
  if (config.oeuvre) parts.push(`Œuvre au programme: ${config.oeuvre}.`);
  if (config.theme) parts.push(`Thème: ${config.theme}.`);
  parts.push('Le sujet doit être réaliste, conforme au BO, avec barème détaillé sur 20 points.');
  return parts.join(' ');
}

function getDefaultBareme(type: ExamType): Record<string, number> {
  if (type === 'commentaire') {
    return {
      comprehension_interpretation: 6,
      construction_reflexion: 6,
      culture_litteraire: 4,
      maitrise_langue: 4,
    };
  }
  if (type === 'dissertation') {
    return {
      prise_en_compte_sujet: 4,
      construction_reflexion: 8,
      culture_litteraire: 4,
      maitrise_langue: 4,
    };
  }
  return { contraction: 10, essai: 10 };
}
