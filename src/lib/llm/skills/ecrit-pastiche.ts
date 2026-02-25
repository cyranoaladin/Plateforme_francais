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
  prompt: `Skill pastiche: tu reçois un paragraphe d'élève (max 300 mots) et tu le réécris à TROIS niveaux de maîtrise différents en conservant EXACTEMENT la même idée.
Niveau "passable" (8-11/20): phrases courtes, vocabulaire courant, registre familier acceptable.
Niveau "attendu" (12-15/20): registre soutenu, connecteurs logiques, une figure de style.
Niveau "excellence" (17-20/20): syntaxe complexe, vocabulaire riche, intertextualité, ironie ou nuance.
Chaque niveau inclut un commentaire expliquant les améliorations et un score estimé.
Tu donnes aussi 3 points d'amélioration concrets.
RÈGLE ABSOLUE: ne génère JAMAIS la suite de la copie. Tu ne réécris QUE le paragraphe soumis.
Marque chaque réécriture comme "Exemple pédagogique — Ne pas copier".`,
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
