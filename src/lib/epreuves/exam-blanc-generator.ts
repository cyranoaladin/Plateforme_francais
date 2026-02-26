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
 */
export async function generateExamBlanc(config: ExamBlancConfig): Promise<ExamBlancSubject> {
  const dureeMap: Record<ExamType, string> = {
    commentaire: '4h',
    dissertation: '4h',
    contraction_essai: '4h (contraction 1h + essai 3h)',
  };

  try {
    const result = await orchestrate({
      skill: 'coach_ecrit',
      userId: config.userId,
      userQuery: buildExamPrompt(config),
      context: `Type: ${config.type}. Durée officielle: ${dureeMap[config.type]}.`,
    });

    const output = result.output as {
      sujet?: string;
      texte?: string;
      consignes?: string;
      bareme?: Record<string, number>;
    };

    return {
      type: config.type,
      sujet: output.sujet ?? `Sujet ${config.type} — ${config.oeuvre ?? 'Libre'}`,
      texte: output.texte ?? '',
      consignes: output.consignes ?? `Durée: ${dureeMap[config.type]}. Respectez le barème officiel.`,
      duree: dureeMap[config.type],
      bareme: output.bareme ?? getDefaultBareme(config.type),
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.error({ err, config }, 'exam_blanc.generation_failed');
    return {
      type: config.type,
      sujet: `Sujet ${config.type} — génération indisponible`,
      texte: '',
      consignes: `Durée: ${dureeMap[config.type]}.`,
      duree: dureeMap[config.type],
      bareme: getDefaultBareme(config.type),
      generatedAt: new Date().toISOString(),
    };
  }
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
    return { introduction: 3, analyse: 8, plan: 4, expression: 3, conclusion: 2 };
  }
  if (type === 'dissertation') {
    return { problematique: 4, argumentation: 8, exemples: 4, expression: 4 };
  }
  return { contraction: 10, essai: 10 };
}
