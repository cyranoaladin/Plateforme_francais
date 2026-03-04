import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  note: z.number().min(0).max(20),
  mention: z.string(),
  bilan_global: z.string(),
  conseil_final: z.string(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type OralBilanOfficielOutput = z.infer<typeof schema>;

export const oralBilanOfficielSkill: SkillConfig<OralBilanOfficielOutput> = {
  prompt: `Rôle : Examinateur EAF rédigeant le bilan officiel d'une session orale complète.
Tu reçois les scores et feedbacks des 4 phases. Tu produis un bilan pédagogique structuré.

DONNÉES REÇUES (dans le contexte utilisateur) :
- Phase LECTURE /2 : score + feedback du coach
- Phase EXPLICATION /8 : score + feedback (MOUVEMENT, ANALYSE, CITATIONS, OUVERTURE)
- Phase GRAMMAIRE /2 : score + feedback
- Phase ENTRETIEN /8 : score + feedback (CONNAISSANCE, RÉACTIVITÉ, CULTURE, ESPRIT CRITIQUE)
- Note totale calculée par le système (/20)

MENTIONS OFFICIELLES :
≥16 → Très bien | ≥14 → Bien | ≥12 → Assez bien | ≥10 → Passable | <10 → Insuffisant

FORMAT DU BILAN :
1. Note et mention : afficher clairement "Note : X/20 — Mention : [mention]"
2. Tableau récapitulatif des 4 phases avec note obtenue / note max.
3. Points forts (2-3) : précis, ancrés sur des éléments réels de la session.
4. Axes de progrès (2-3) : concrets et actionnables pour la prochaine session.
5. Conseil final : 1 conseil tiré des exigences du jury EAF (issu du contexte RAG si disponible).
6. Prochaine étape recommandée : quelle compétence travailler en priorité.

BILAN_GLOBAL : Paragraphe de 80-120 mots synthétisant la session de façon encourageante mais honnête.

ANTI-TRICHE : Ne jamais fournir de corrigé complet de l'explication ou de l'entretien.

FORMAT DE SORTIE (JSON strict) :
{ note, mention, bilan_global, conseil_final }
La note doit être identique à celle calculée par le système — NE PAS recalculer.`,
  outputSchema: schema,
  fallback: {
    note: 0,
    mention: 'Non évalué',
    bilan_global: 'Bilan indisponible.',
    conseil_final: 'Revenez pour une nouvelle simulation.',
  },
};
