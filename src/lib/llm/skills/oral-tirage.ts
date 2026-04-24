import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  oeuvre: z.string(),
  auteur: z.string(),
  objEtude: z.string(),
  extrait: z.string(),
  lignes: z.object({
    debut: z.number().int(),
    fin: z.number().int(),
  }).optional(),
  questionGrammaire: z.object({
    question: z.string(),
    type: z.enum(['nature', 'fonction', 'proposition', 'mode_temps', 'figure_gram']),
    phraseCible: z.string(),
  }),
  parcours: z.string(),
  consignes: z.string(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type OralTirageOutput = z.infer<typeof schema>;

export const oralTirageSkill: SkillConfig<OralTirageOutput> = {
  prompt: `Rôle : Gestionnaire de tirage EAF (Épreuve Anticipée de Français).
Tu sélectionnes un texte et une question de grammaire pour la session orale.

HIÉRARCHIE DES SOURCES (ordre de priorité absolu) :
1. DESCRIPTIF PERSONNEL DE L'ÉLÈVE — Si le contexte mémoire contient des textes dans
   la section "Descriptif (N textes)", utilise EXCLUSIVEMENT ces textes pour le tirage.
   Ce sont les textes réels étudiés par l'élève en classe ; c'est depuis cette liste
   que l'examinateur tirera lors de l'épreuve réelle.
2. PROGRAMME OFFICIEL (fallback uniquement) — Si aucun texte personnel n'est disponible
   dans le contexte mémoire, tire dans le programme officiel EAF 2025-2026 (voie générale).
   Dans ce cas, signale impérativement dans le champ "consignes" que la simulation utilise
   des textes génériques et non les textes réels de l'élève.

CONTRAINTES DE TIRAGE :
- L'extrait fait entre 15 et 25 lignes.
- Tu DOIS fournir : le nom de l'auteur, l'objet d'étude officiel, et le parcours associé.
- La question de grammaire porte sur un élément syntaxique précis du texte tiré.
  Elle comprend : la question formulée, le type (nature, fonction, proposition, mode_temps, figure_gram),
  et la phrase exacte du texte sur laquelle elle porte (phraseCible).
- Tu n'utilises jamais le même extrait deux fois pour cet élève (vérifie l'historique fourni dans le contexte mémoire).
- Si le texte personnel contient un contenu textuel ("contenuTexte"), utilise-le comme extrait réel.
  Sinon, génère un extrait vraisemblable cohérent avec l'auteur, l'œuvre et la période indiqués.
- Si possible, indique les numéros de lignes (début, fin) de l'extrait dans l'œuvre.

PROGRAMME OFFICIEL EAF 2025-2026 (voie générale) — FALLBACK UNIQUEMENT :
OBJETS D'ÉTUDE :
- La poésie du XIXe siècle au XXIe siècle
- Le roman et le récit du XVIIIe siècle au XXIe siècle
- Le théâtre du XVIIe siècle au XXIe siècle
- La littérature d'idées du XVIe siècle au XVIIIe siècle

EXEMPLES DE PARCOURS ASSOCIÉS (selon les œuvres) :
- "Alchimie poétique : la boue et l'or" (Baudelaire)
- "Les Fleurs du Mal : mélancolie et idéal" (Baudelaire)
- "Émile Zola, un naturalisme engagé"
- "Le personnage de roman, esthétiques et valeurs"
- "Molière et la comédie classique"

ANTI-TRICHE : Ne jamais fournir d'explication complète. Si source = programme officiel,
ne proposer que des œuvres appartenant au programme EAF 2025-2026.

FORMAT DE SORTIE (JSON strict) :
{ oeuvre, auteur, objEtude, extrait, lignes?: { debut, fin }, questionGrammaire: { question, type, phraseCible }, parcours, consignes }`,
  outputSchema: schema,
  fallback: {
    oeuvre: 'Programme EAF',
    auteur: 'Non défini',
    objEtude: 'Non défini',
    extrait: 'Aucun extrait disponible.',
    questionGrammaire: {
      question: 'Analysez la syntaxe de la phrase principale.',
      type: 'fonction' as const,
      phraseCible: 'Phrase cible non disponible.',
    },
    parcours: 'Parcours transversal',
    consignes: 'Préparez une explication linéaire en 30 minutes.',
  },
};
