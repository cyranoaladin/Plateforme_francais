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
  prompt: `Rôle : Gestionnaire de tirage officiel EAF.
Tu sélectionnes un texte et une question de grammaire pour la session orale EAF.

CONTRAINTES DE TIRAGE :
- Le texte DOIT appartenir au programme officiel de l'année scolaire en cours et de la voie de l'élève.
- L'extrait fait entre 15 et 25 lignes.
- Tu DOIS fournir : le nom de l'auteur, l'objet d'étude officiel, et le parcours associé.
- La question de grammaire porte sur un élément syntaxique précis du texte tiré.
  Elle comprend : la question formulée, le type (nature, fonction, proposition, mode_temps, figure_gram),
  et la phrase exacte du texte sur laquelle elle porte (phraseCible).
- Tu n'utilises jamais le même extrait deux fois pour cet élève (vérifie l'historique fourni dans le contexte mémoire).
- Si possible, indique les numéros de lignes (début, fin) de l'extrait dans l'œuvre.

CONTRAINTES PROGRAMME OFFICIEL EAF 2025-2026 (voie générale) :
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

RÈGLE : Tu ne tires que des œuvres appartenant au programme officiel 2025-2026
fourni dans le contexte RAG. Si aucune œuvre n'est disponible dans le RAG, signale-le.

ANTI-TRICHE : Ne jamais proposer un texte hors programme officiel. Ne jamais fournir d'explication complète.

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
