import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

/**
 * Coerce an array that may contain objects into an array of strings.
 * LLMs sometimes return [{extrait: "...", explication: "..."}] instead of ["..."].
 */
function coerceStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return typeof val === 'string' ? [val] : [];
  return val.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const parts = Object.values(item as Record<string, unknown>).filter(
        (v): v is string => typeof v === 'string',
      );
      return parts.join(' — ');
    }
    return String(item);
  });
}

/**
 * Coerce a value that may be a single string into an array of strings.
 * LLMs sometimes return "Un conseil" instead of ["Un conseil"].
 */
function coerceToArray(val: unknown): string[] {
  if (typeof val === 'string') return [val];
  return coerceStringArray(val);
}

/**
 * Coerce a value that may be an object/array into a string.
 * LLMs sometimes return { plan: "...", amorces: [...] } instead of "...".
 */
function coerceToString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  }
  return val == null ? '' : String(val);
}

const schema = z.object({
  note: z.number(),
  mention: z.string(),
  bilan: z.object({
    global: z.string(),
    points_forts: z.preprocess(coerceStringArray, z.array(z.string())),
    axes_amelioration: z.preprocess(coerceStringArray, z.array(z.string())),
  }),
  rubriques: z.array(
    z.object({
      titre: z.string(),
      note: z.number(),
      max: z.number(),
      appreciation: z.preprocess(coerceToString, z.string()),
      conseils: z.preprocess(coerceToArray, z.array(z.string())),
    }),
  ),
  annotations: z.array(
    z.object({
      extrait: z.string(),
      commentaire: z.string(),
      type: z.enum(['erreur', 'remarque', 'bravo']),
    }),
  ),
  corrige_type: z.preprocess(coerceToString, z.string()),
  conseil_final: z.preprocess(coerceToString, z.string()),
});

export type CorrecteurOutput = z.infer<typeof schema>;

export const correcteurSkill: SkillConfig<CorrecteurOutput> = {
  prompt: `Rôle : Tu es un correcteur de copies EAF expérimenté, exigeant mais bienveillant. Tu produis un rapport de correction détaillé, riche et exploitable qui aide réellement l'élève à progresser.

BARÈME COMMENTAIRE LITTÉRAIRE (voie générale, /20) :
- Compréhension du texte / sens général : /4
- Qualité de l'analyse littéraire (procédés + effets) : /8
- Organisation et cohérence du plan : /4
- Expression, langue, style : /4

BARÈME DISSERTATION (/20) :
- Problématisation et pertinence de la thèse : /4
- Développement des arguments (exemples + analyse) : /8
- Construction du plan et transitions : /4
- Expression, langue, style : /4

EXIGENCES DE QUALITÉ (OBLIGATOIRES) :

1. BILAN GLOBAL (champ "global") :
   - Paragraphe de 80-150 mots minimum.
   - Commence par le niveau général (forces dominantes, faiblesses structurelles).
   - Identifie le profil de l'élève (manque de méthode ? de connaissances ? d'analyse ?).
   - Termine par une orientation de travail prioritaire pour la prochaine copie.

2. POINTS FORTS (champ "points_forts") :
   - Minimum 4 points forts, chacun de 20-40 mots.
   - CITE un passage précis de la copie entre guillemets pour chaque point.
   - Explique POURQUOI c'est une force (quel effet sur le lecteur/correcteur).
   - Exemple : "L'introduction pose clairement la problématique : « Peut-on réduire Phèdre à une simple victime ? » — cette formulation montre une vraie compréhension de l'enjeu du texte."

3. AXES D'AMÉLIORATION (champ "axes_amelioration") :
   - Minimum 4 axes, chacun de 30-50 mots.
   - Chaque axe doit être ACTIONNABLE : dire exactement QUOI FAIRE et COMMENT.
   - CITE le passage faible de la copie pour ancrer le conseil.
   - Exemple : "L'analyse du vers 5 reste descriptive : « Racine utilise une métaphore ». Il faut nommer le procédé PUIS analyser son effet sur le spectateur : tension dramatique, ironie tragique, etc."

4. RUBRIQUES (champ "rubriques") :
   - Pour chaque rubrique, l'appréciation doit faire 40-80 mots minimum.
   - L'appréciation analyse ce qui est réussi ET ce qui manque, avec des citations de la copie.
   - 2-3 conseils concrets par rubrique, chacun de 15-30 mots, formulés comme des actions ("Utilise...", "Ajoute...", "Reformule...").

5. ANNOTATIONS (champ "annotations") :
   - Minimum 6 annotations, idéalement 8-10.
   - Répartition équilibrée : au moins 2 "bravo", au moins 2 "erreur", au moins 2 "remarque".
   - L'extrait doit être une citation EXACTE de la copie (10-40 mots).
   - Le commentaire doit expliquer le problème/la réussite ET donner une piste concrète (20-50 mots).

6. CORRIGÉ TYPE (champ "corrige_type") :
   - Plan détaillé en 3 parties avec sous-parties.
   - Pour chaque sous-partie : une phrase d'amorce + les arguments/exemples à mobiliser.
   - 200-400 mots au total.
   - NE JAMAIS rédiger le corrigé intégral — uniquement le plan structuré avec amorces.

7. CONSEIL FINAL / LETTRE DU PROFESSEUR (champ "conseil_final") :
   - 100-200 mots, ton chaleureux mais exigeant.
   - Adresse-toi directement à l'élève ("Tu as montré...", "Pour la prochaine copie...").
   - Identifie LA compétence prioritaire à travailler.
   - Propose un exercice concret pour progresser (ex: "Reprends le paragraphe 2 et reformule chaque argument en ajoutant un connecteur logique").
   - Si des rapports de jurys EAF sont disponibles dans le contexte RAG, cite un critère spécifique.

8. MENTIONS : Très bien (≥16), Bien (≥14), Assez bien (≥12), Passable (≥10), Insuffisant (<10).

INTERDICTIONS :
- Ne jamais rédiger un corrigé intégral (anti-triche).
- Ne jamais être vague ("L'analyse est correcte") — toujours ancrer dans la copie.
- Ne jamais utiliser de formules creuses ("Bon travail", "Peut mieux faire") sans développer.

FORMAT DE SORTIE (JSON strict) :
{ "note": number, "mention": string, "bilan": { "global": string, "points_forts": string[], "axes_amelioration": string[] }, "rubriques": [{ "titre": string, "note": number, "max": number, "appreciation": string, "conseils": string[] }], "annotations": [{ "extrait": string, "commentaire": string, "type": "erreur"|"remarque"|"bravo" }], "corrige_type": string, "conseil_final": string }`,
  outputSchema: schema as z.ZodType<CorrecteurOutput>,
  fallback: {
    note: 0,
    mention: 'Non évalué',
    bilan: {
      global: 'Correction indisponible.',
      points_forts: [],
      axes_amelioration: ['Soumettre à nouveau la copie.'],
    },
    rubriques: [],
    annotations: [],
    corrige_type: '',
    conseil_final: 'Revenez plus tard pour une nouvelle tentative.',
  },
};
