import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const registerBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).max(120).optional(),
  role: z.enum(['eleve', 'enseignant', 'parent']).optional(),
});

export const memoryEventTypes = z.enum([
  'navigation',
  'interaction',
  'discussion',
  'resource',
  'evaluation',
  'quiz',
  'auth',
]);

export const memoryEventBodySchema = z.object({
  type: memoryEventTypes.optional().default('interaction'),
  feature: z.string().trim().min(1).max(120).optional().default('unknown'),
  path: z.string().trim().min(1).max(300).optional(),
  payload: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]))
    .optional(),
});

export const langueEvaluationBodySchema = z.object({
  exerciseId: z.union([z.literal(1), z.literal(2)]),
  answer: z.string().default(''),
});

export const ragSearchBodySchema = z.object({
  query: z.string().trim().min(1),
  maxResults: z.number().int().min(1).max(10).optional().default(5),
});

export const epreuveGenerateBodySchema = z.object({
  type: z.enum(['commentaire', 'dissertation', 'contraction_essai']),
  oeuvre: z.string().trim().min(1).max(200).optional(),
  theme: z.string().trim().min(1).max(200).optional(),
});

export const copieUploadMetaSchema = z.object({
  fileType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  fileSize: z.number().int().positive(),
});

export const oralSessionStartBodySchema = z.object({
  oeuvre: z.string().trim().min(1).max(200),
  extrait: z.string().trim().min(1).optional(),
  questionGrammaire: z.string().trim().min(1).optional(),
});

export const oralSessionInteractBodySchema = z.object({
  step: z.enum(['LECTURE', 'EXPLICATION', 'GRAMMAIRE', 'ENTRETIEN']),
  transcript: z.string().trim().min(1),
  duration: z.number().int().min(1).max(1800),
});

export const oralSessionEndBodySchema = z.object({
  notes: z.string().trim().max(1000).optional(),
});

export const studentProfileBodySchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  classLevel: z.string().trim().min(1).max(120).optional(),
  targetScore: z.string().trim().min(1).max(20).optional(),
  establishment: z.string().trim().max(160).optional(),
  eafDate: z.string().date().optional(),
  onboardingCompleted: z.boolean().optional(),
  selectedOeuvres: z.array(z.string().trim().min(1).max(200)).optional(),
  classCode: z.string().trim().max(12).optional(),
  parcoursProgress: z.array(z.string().trim().min(1).max(120)).optional(),
  badges: z.array(z.string().trim().min(1).max(120)).optional(),
  preferredObjects: z.array(z.string().trim().min(1).max(120)).optional(),
  weakSkills: z.array(z.string().trim().min(1).max(120)).optional(),
});

export const parcoursGenerateBodySchema = z.object({
  forceRegenerate: z.boolean().optional(),
});

export const quizGenerateBodySchema = z.object({
  theme: z.string().trim().min(1).max(120),
  difficulte: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  nbQuestions: z.union([z.literal(5), z.literal(10), z.literal(20)]),
});

export const onboardingCompleteBodySchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  classLevel: z.string().trim().min(1).max(120),
  establishment: z.string().trim().max(160).optional(),
  eafDate: z.string().date(),
  selectedOeuvres: z.array(z.string().trim().min(1).max(200)).min(1),
  weakSignals: z.array(z.string().trim().min(1).max(120)).max(6),
  classCode: z.string().trim().max(12).optional(),
});

export const tuteurMessageBodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .max(20)
    .optional()
    .default([]),
});

export const badgeEvaluateBodySchema = z.object({
  trigger: z.enum(['first_copy', 'quiz_perfect', 'oral_done', 'score']).optional(),
  score: z.number().optional(),
});

export const teacherCorrectionCommentBodySchema = z.object({
  comment: z.string().trim().min(1).max(1000),
});
