import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  oeuvre: z.string(),
  auteur: z.string(),
  parcours: z.string(),
  resume: z.string(),
  themes: z.array(z.string()),
  procedes: z.array(z.string()),
  extraits_cles: z.array(z.string()),
  liens_parcours: z.string(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type RevisionFichesOutput = z.infer<typeof schema>;

export const revisionFichesSkill: SkillConfig<RevisionFichesOutput> = {
  prompt: 'Skill revision_fiches: générer une fiche de révision synthétique pour une oeuvre EAF. Résumé, thèmes, procédés, extraits clés, liens au parcours. Ne jamais fournir d\'explication complète.',
  outputSchema: schema,
  fallback: {
    oeuvre: 'Non spécifiée',
    auteur: 'Inconnu',
    parcours: 'Non défini',
    resume: 'Fiche non disponible.',
    themes: [],
    procedes: [],
    extraits_cles: [],
    liens_parcours: 'À compléter.',
  },
};
