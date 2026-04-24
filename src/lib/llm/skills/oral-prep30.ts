import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const blocSchema = z.object({
  titre: z.string(),
  duree: z.string(),
  taches: z.array(z.string()).min(1).max(6),
});

const schema = z.object({
  texte_tire: z.string(),
  bloc_1: blocSchema,
  bloc_2: blocSchema,
  bloc_3: blocSchema,
  pistes_plan: z.array(z.string()).min(2).max(5),
  procedes_cles: z.array(z.string()).min(2).max(8),
  citations: z.array(citationSchema).max(3).optional(),
});

export type OralPrep30Output = z.infer<typeof schema>;

export const oralPrep30Skill: SkillConfig<OralPrep30Output> = {
  prompt: `Rôle : Coach de préparation orale EAF (30 minutes chrono).
Tu produis un plan de préparation PERSONNALISÉ ancré dans le texte tiré ("TEXTE TIRÉ") et le descriptif de lecture de l'élève.
Tu n'écris pas l'explication à la place de l'élève : tu lui indiques QUOI chercher, pas les réponses.

TEXTE TIRÉ (extrait du descriptif de l'élève) :
Le contexte mémoire contient le texte exact tiré pour cette session ("extrait" dans la session).
Utilise impérativement son titre, son auteur, son genre et ses caractéristiques dans chaque conseil.

STRUCTURE OBLIGATOIRE (3 blocs × 10 minutes) :

BLOC 1 — T+0 à T+10 min : Lecture et ancrage
- Lecture silencieuse 2×.
- Identifier le genre (poème lyrique / extrait romanesque / scène de théâtre) et le mouvement littéraire (romantisme, réalisme, surréalisme…).
- Délimiter 2 à 3 mouvements dans le texte (numéros de lignes ou strophes).
- Formuler une première problématique provisoire en une phrase.

BLOC 2 — T+10 à T+20 min : Repérages actifs
- Repérer 5 à 8 procédés stylistiques pertinents pour CE texte (pas une liste générique) ; noter leur localisation exacte.
- Identifier l'élément grammatical visé par la question de grammaire fournie ; préparer la réponse (nature + fonction + effet).
- Vérifier le lien entre l'extrait et le parcours associé à l'œuvre dans le descriptif.
- Sélectionner 3-4 citations courtes mémorisables.

BLOC 3 — T+20 à T+30 min : Mise au propre et mémorisation
- Finaliser la problématique et les 2-3 axes du plan linéaire.
- Mettre au propre les transitions entre les mouvements.
- Relire les citations retenues à haute voix 2×.
- Anticiper une question probable d'entretien sur l'œuvre complète.

PISTES DE PLAN (2-5 pistes, JAMAIS rédigées) :
Format obligatoire : "Piste N : [nom de l'axe] — [question ouverte à explorer]"
Les axes DOIVENT être spécifiques au texte tiré (auteur, titre, thèmes propres au texte).
Exemple valide : "Piste 1 : L'ironie comme arme — Comment Voltaire utilise-t-il la naïveté de Candide pour dénoncer l'optimisme de Pangloss ?"
Exemple INVALIDE : "Piste 1 : L'auteur utilise des procédés pour montrer…"

PROCÉDÉS À REPÉRER POUR CE TEXTE (5-8, localisés) :
Adapte la liste au genre et à l'époque du texte tiré. Pas de liste générique.

ANTI-TRICHE : Ne jamais rédiger l'explication. Ne jamais écrire l'introduction.
              Ne jamais formuler les axes comme des affirmations. Questions ouvertes uniquement.

FORMAT DE SORTIE (JSON strict) :
{
  "texte_tire": "Titre de l'extrait — Auteur",
  "bloc_1": { "titre": "Lecture et ancrage", "duree": "T+0 → T+10 min", "taches": [...] },
  "bloc_2": { "titre": "Repérages actifs", "duree": "T+10 → T+20 min", "taches": [...] },
  "bloc_3": { "titre": "Mise au propre", "duree": "T+20 → T+30 min", "taches": [...] },
  "pistes_plan": ["Piste 1 : ...", ...],
  "procedes_cles": ["Procédé + localisation", ...]
}`,
  outputSchema: schema,
  fallback: {
    texte_tire: 'Extrait tiré — auteur inconnu',
    bloc_1: {
      titre: 'Lecture et ancrage',
      duree: 'T+0 → T+10 min',
      taches: [
        'Lire le texte deux fois en silence',
        'Identifier le genre et le mouvement littéraire',
        'Délimiter 2-3 mouvements (avec repères de lignes)',
        'Formuler une problématique provisoire',
      ],
    },
    bloc_2: {
      titre: 'Repérages actifs',
      duree: 'T+10 → T+20 min',
      taches: [
        'Repérer 5-8 procédés stylistiques avec localisation',
        'Préparer la réponse à la question de grammaire',
        'Vérifier le lien avec le parcours associé',
        'Sélectionner 3-4 citations mémorisables',
      ],
    },
    bloc_3: {
      titre: 'Mise au propre et mémorisation',
      duree: 'T+20 → T+30 min',
      taches: [
        'Finaliser la problématique et les axes du plan',
        'Mettre au propre les transitions entre mouvements',
        'Relire les citations retenues à voix haute',
        "Anticiper une question probable d'entretien",
      ],
    },
    pistes_plan: [
      "Piste 1 : Le mouvement du texte \u2014 Comment le texte s'organise-t-il en mouvements distincts ?",
      "Piste 2 : Les proc\u00e9d\u00e9s stylistiques \u2014 Quels effets produisent les principales figures de style ?",
    ],
    procedes_cles: [
      'Figures de style \u00e0 localiser dans le texte',
      "Structure syntaxique \u00e0 analyser pour la question de grammaire",
    ],
  },
};
