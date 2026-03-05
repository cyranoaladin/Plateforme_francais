import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

/**
 * P0-SaaS-2 — Skill Pastiche (Mimétisme de Plume)
 * Per ADDENDUM §Partie A, Différenciateur #2.
 *
 * Rewrites the student's paragraph at 3 levels: Passable, Attendu EAF, Excellence.
 * NEVER generates continuation of the student's work.
 * Input is limited to 300 words max (enforced at API layer).
 */

const niveauSchema = z.object({
  texte: z.string(),
  commentaire: z.string(),
  score_estime: z.string(),
});

const schema = z.object({
  original: z.string(),
  niveaux: z.object({
    passable: niveauSchema,
    attendu: niveauSchema,
    excellence: niveauSchema,
  }),
  pointsAmelioration: z.array(z.string()).min(1).max(5),
  sourcesRAG: z.array(citationSchema).max(3).optional(),
});

export type PasticheSkillOutput = z.infer<typeof schema>;

export const pasticheSkill: SkillConfig<PasticheSkillOutput> = {
  prompt: `Rôle : Mimétisme de Plume — Réécriture pédagogique à 3 niveaux EAF.
Tu reçois un paragraphe d'élève (max 300 mots) et tu le réécris à TROIS niveaux de maîtrise différents en conservant EXACTEMENT la même idée.

NIVEAUX :
- "passable" (8-11/20) : phrases courtes, vocabulaire courant, registre familier acceptable
- "attendu" (12-15/20) : registre soutenu, connecteurs logiques, une figure de style
- "excellence" (17-20/20) : syntaxe complexe, vocabulaire riche, intertextualité, ironie ou nuance

POUR CHAQUE NIVEAU :
- texte : la réécriture du paragraphe (même idée, style différent)
- commentaire : explication des améliorations apportées (2-3 phrases)
- score_estime : note estimée sous forme "X/20"

RÈGLES :
1. Ne génère JAMAIS la suite de la copie — réécris UNIQUEMENT le paragraphe soumis
2. Marque chaque réécriture comme "Exemple pédagogique — Ne pas copier"
3. Donne 3-5 points d'amélioration concrets et actionnables
4. Reproduis le paragraphe original dans le champ "original"

FORMAT DE SORTIE (JSON strict) :
{ "original": "texte de l'élève", "niveaux": { "passable": { "texte": "...", "commentaire": "...", "score_estime": "9/20" }, "attendu": { "texte": "...", "commentaire": "...", "score_estime": "13/20" }, "excellence": { "texte": "...", "commentaire": "...", "score_estime": "18/20" } }, "pointsAmelioration": ["conseil1", "conseil2", "conseil3"] }`,
  outputSchema: schema,
  fallback: {
    original: '',
    niveaux: {
      passable: { texte: '', commentaire: 'Niveau basique.', score_estime: '9/20' },
      attendu: { texte: '', commentaire: 'Niveau attendu au bac.', score_estime: '13/20' },
      excellence: { texte: '', commentaire: 'Niveau excellence.', score_estime: '18/20' },
    },
    pointsAmelioration: ['Enrichir le vocabulaire', 'Ajouter des connecteurs logiques', 'Varier la syntaxe'],
  },
};
