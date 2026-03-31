import { z } from 'zod';

// Force all Zod error messages to French
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.expected === 'string') return { message: 'Ce champ doit être du texte.' };
      if (issue.expected === 'number') return { message: 'Ce champ doit être un nombre.' };
      if (issue.expected === 'boolean') return { message: 'Ce champ doit être vrai ou faux.' };
      return { message: `Type attendu : ${issue.expected}.` };
    case 'too_small':
      if (issue.type === 'string') return { message: `Ce champ doit contenir au moins ${issue.minimum} caractère(s).` };
      if (issue.type === 'number') return { message: `La valeur doit être au moins ${issue.minimum}.` };
      if (issue.type === 'array') return { message: `Au moins ${issue.minimum} élément(s) requis.` };
      return { message: ctx.defaultError };
    case 'too_big':
      if (issue.type === 'string') return { message: `Ce champ ne doit pas dépasser ${issue.maximum} caractère(s).` };
      if (issue.type === 'number') return { message: `La valeur ne doit pas dépasser ${issue.maximum}.` };
      return { message: ctx.defaultError };
    case 'invalid_string':
      if (issue.validation === 'email') return { message: 'Adresse e-mail invalide.' };
      if (issue.validation === 'url') return { message: 'URL invalide.' };
      return { message: 'Format invalide.' };
    case 'invalid_enum_value':
      return { message: `Valeur non autorisée. Options : ${issue.options.join(', ')}.` };
    default:
      return { message: ctx.defaultError };
  }
});

export const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .max(128, 'Le mot de passe ne doit pas dépasser 128 caractères.')
  .regex(/[a-z]/, 'Au moins une minuscule.')
  .regex(/[A-Z]/, 'Au moins une majuscule.')
  .regex(/[0-9]/, 'Au moins un chiffre.');

export const loginBodySchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.'),
  password: z.string().min(1),
});

export const registerBodySchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.'),
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(120).optional(),
  acceptedCgu: z.boolean().refine((v) => v === true, { message: 'Vous devez accepter les CGU.' }),
  cguVersion: z.string().trim().min(1).max(20).default('2026-03'),
  isMinor: z.boolean().default(false),
  parentEmail: z.string().trim().email('Adresse e-mail invalide.').optional(),
  teacherEmail: z.string().trim().email('Adresse e-mail invalide.').optional(),
}).refine(
  (data) => !data.isMinor || (data.parentEmail && data.parentEmail.length > 0),
  { message: 'Email parental requis pour les mineurs de moins de 15 ans.', path: ['parentEmail'] },
);

export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.'),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().trim().min(1),
  password: passwordSchema,
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
  exerciseId: z.coerce.string().min(1),
  sentence: z.string().trim().min(1).max(1000).optional(),
  question: z.string().trim().min(1).max(1000).optional(),
  answer: z.string().default(''),
});

export const langueGenerateBodySchema = z.object({
  theme: z.enum(['subordonnees', 'relations_logiques', 'systeme_verbal', 'mixte']).optional().default('mixte'),
  count: z.number().int().min(1).max(10).optional().default(5),
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
  mode: z.enum(['SIMULATION', 'FREE_PRACTICE']).optional().default('SIMULATION'),
});

export const oralSessionInteractBodySchema = z.object({
  step: z.enum(['LECTURE', 'EXPLICATION', 'GRAMMAIRE', 'ENTRETIEN']),
  transcript: z.string().trim().min(1),
  duration: z.number().int().min(1).max(1800),
  examinerProfile: z.enum(['BIENVEILLANT', 'NEUTRE', 'HOSTILE']).optional(),
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
  parentEmail: z.string().trim().email('Adresse e-mail invalide.').optional().nullable(),
  teacherEmail: z.string().trim().email('Adresse e-mail invalide.').optional().nullable(),
});

export const parcoursGenerateBodySchema = z.object({
  forceRegenerate: z.boolean().optional(),
});

export const QUIZ_THEMES = [
  'grammaire',
  'figures_de_style',
  'mouvements_litteraires',
  'poesie',
  'roman',
  'theatre',
  'litterature_idees',
  'methode_commentaire',
  'methode_dissertation',
  'oral_eaf',
] as const;

export type QuizTheme = (typeof QUIZ_THEMES)[number];

export const quizGenerateBodySchema = z.object({
  theme: z.enum(QUIZ_THEMES),
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
  oeuvreChoisieEntretien: z.string().trim().min(1).max(300).optional(),
});

export const updateOeuvreChoisieSchema = z.object({
  oeuvreChoisieEntretien: z.string().trim().min(1).max(300),
});

export const tuteurMessageBodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  workId: z.string().trim().min(1).max(200).optional(),
  parcours: z.string().trim().min(1).max(200).optional(),
  sessionId: z.string().trim().min(1).max(120).optional(),
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

const descriptifTexteItemSchema = z.object({
  objetEtude: z.enum(['poesie', 'roman', 'theatre', 'litterature_idees']),
  oeuvre: z.string().trim().min(1).max(200),
  auteur: z.string().trim().min(1).max(100),
  typeExtrait: z.enum(['extrait_oeuvre', 'extrait_parcours']),
  titre: z.string().trim().min(1).max(200),
  premieresLignes: z.string().trim().max(400).optional(),
});

export const descriptifUpsertSchema = z.object({
  textes: z.array(descriptifTexteItemSchema).min(1).max(60),
});

export type DescriptifTexteItem = z.infer<typeof descriptifTexteItemSchema>;

export const redeemCodeBodySchema = z.object({
  code: z.string().trim().min(1, 'Le champ "code" est requis.').max(64),
});

export const carnetEntrySchema = z.object({
  oeuvre: z.string().trim().min(1).max(200),
  auteur: z.string().trim().min(1).max(100),
  type: z.enum(['citation', 'note', 'reaction', 'resume', 'lien_culturel']),
  contenu: z.string().trim().min(1).max(2000),
  page: z.string().trim().max(20).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
});
