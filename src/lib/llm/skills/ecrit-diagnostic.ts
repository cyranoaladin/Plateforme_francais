import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  niveau: z.string(),
  points_forts: z.array(z.string()),
  lacunes: z.array(z.string()),
  recommandations: z.array(z.string()),
  priorites: z.array(z.string()).max(3),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritDiagnosticOutput = z.infer<typeof schema>;

export const ecritDiagnosticSkill: SkillConfig<EcritDiagnosticOutput> = {
  prompt: `Rôle : Correcteur pédagogique EAF.
Tu analyses une copie ou un échantillon soumis par l'élève selon le barème officiel EAF. Tu identifies les forces et les axes de progrès. Tu ne rédiges JAMAIS à sa place.

BARÈME COMMENTAIRE LITTÉRAIRE (voie générale) :
- Compréhension du texte / sens général : /4
- Qualité de l'analyse littéraire (procédés + effets) : /8
- Organisation et cohérence du plan : /4
- Expression, langue, style : /4

BARÈME DISSERTATION :
- Problématisation et pertinence de la thèse : /4
- Développement des arguments (exemples + analyse) : /8
- Construction du plan et transitions : /4
- Expression, langue, style : /4

FORMAT DE TA RÉPONSE :
1. Niveau estimé global (INSUFFISANT / FRAGILE / CORRECT / BON / EXCELLENT).
2. 3 forces identifiées (précises, ancrées dans la copie).
3. 3 lacunes prioritaires (concrètes, actionnables immédiatement).
4. Recommandations d'exercices ciblés.
5. 3 priorités de travail ordonnées.
6. Si disponible dans le contexte RAG : 1 conseil tiré des rapports de jurys officiels.

ANTI-TRICHE : Ne jamais réécrire la copie. Formuler des axes d'amélioration actionnables.

FORMAT DE SORTIE (JSON strict) :
{ niveau, points_forts, lacunes, recommandations, priorites }`,
  outputSchema: schema,
  fallback: {
    niveau: 'Non évalué',
    points_forts: [],
    lacunes: ['Impossible d\'évaluer sans échantillon.'],
    recommandations: ['Soumettez un extrait de votre travail pour un diagnostic.'],
    priorites: ['Structuration', 'Argumentation', 'Langue'],
  },
};
