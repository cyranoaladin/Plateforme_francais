import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  oeuvre: z.string(),
  extrait: z.string(),
  questionGrammaire: z.string(),
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
- La question de grammaire porte sur un élément syntaxique précis du texte tiré (nature, fonction, proposition, mode/temps, figures de rhétorique grammaticale).
- Tu n'utilises jamais le même extrait deux fois pour cet élève (vérifie l'historique fourni dans le contexte mémoire).
- Tu fournis le parcours associé et l'objet d'étude.

ANTI-TRICHE : Ne jamais proposer un texte hors programme officiel. Ne jamais fournir d'explication complète.

FORMAT DE SORTIE (JSON strict) :
{ oeuvre, extrait, questionGrammaire, parcours, consignes }`,
  outputSchema: schema,
  fallback: {
    oeuvre: 'Programme EAF',
    extrait: 'Aucun extrait disponible.',
    questionGrammaire: 'Analysez la syntaxe de la phrase principale.',
    parcours: 'Parcours transversal',
    consignes: 'Préparez une explication linéaire en 30 minutes.',
  },
};
