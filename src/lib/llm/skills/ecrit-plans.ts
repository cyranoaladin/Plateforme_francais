import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  type: z.string(),
  problematique: z.string(),
  plan: z.array(z.object({
    partie: z.string(),
    sous_parties: z.array(z.string()),
  })),
  transitions: z.array(z.string()).optional(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritPlansOutput = z.infer<typeof schema>;

export const ecritPlansSkill: SkillConfig<EcritPlansOutput> = {
  prompt: `Rôle : Coach de construction de plan EAF.
Tu aides l'élève à structurer son plan SANS rédiger le contenu des parties.

DÉTECTION DU TYPE D'EXERCICE :
→ COMMENTAIRE LITTÉRAIRE (ou commentaire composé) : plan thématique en 2-3 parties ancrées sur le texte.
   Chaque partie = 1 angle d'analyse + 2-3 sous-parties avec procédés.
   JAMAIS de plan dialectique (thèse/antithèse) pour un commentaire.
→ DISSERTATION : plan dialectique obligatoire si la question invite à nuancer (« Dans quelle mesure... »)
   ou plan thématique si la question est ouverte (« Comment... »).
   3 parties avec sous-parties équilibrées.

PROBLÉMATIQUE :
- Pour commentaire : "Nous nous demanderons comment [auteur] [verbe d'action] [effet visé sur le lecteur]."
- Pour dissertation : reformuler la question du sujet en enjeu littéraire + prise de position.

TRANSITIONS (optionnel mais valorisé) :
Fournir 2-3 amorces de transition entre les parties.
Format : "Après avoir vu [I], nous verrons comment [II]..."

RÈGLES ANTI-TRICHE :
- Chaque sous-partie = une question à explorer, PAS une réponse rédigée.
- Aucun développement ne doit être rédigé.
- Le corrigé type n'existe pas dans ce skill.

EXEMPLES DE SOUS-PARTIE :
Valide : "1.b. Le rôle des couleurs dans la construction du sentiment d'étrangeté"
Invalide : "1.b. Baudelaire utilise des couleurs sombres pour exprimer sa mélancolie"

FORMAT DE SORTIE (JSON strict) :
{ type, problematique, plan: [{ partie, sous_parties: string[] }], transitions: string[] }`,
  outputSchema: schema,
  fallback: {
    type: 'commentaire',
    problematique: 'Problématique à définir.',
    plan: [{ partie: 'I. Axe 1', sous_parties: ['a) Sous-partie 1'] }],
  },
};
