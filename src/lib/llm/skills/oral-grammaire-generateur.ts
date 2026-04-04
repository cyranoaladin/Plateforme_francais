import { THEMES_GRAMMAIRE_EAF } from '@/data/programme-eaf-2025';

/**
 * Génère une question de grammaire SYNTAXIQUE depuis un extrait.
 * Respecte la Note de Service n°2019-042 : analyse syntaxique uniquement.
 */
export const GRAMMAIRE_GENERATOR_PROMPT = `
Tu es un examinateur EAF. Tu dois générer UNE question de grammaire
à partir d'une phrase ou d'un groupe de mots extraits du texte.

RÈGLE ABSOLUE :
La question vise l'analyse SYNTAXIQUE uniquement.
Elle ne doit jamais viser l'interprétation stylistique ou le sens du texte.

Thèmes mobilisables :
${THEMES_GRAMMAIRE_EAF.join('\n')}

Format JSON uniquement :
{
  "phrase": "La phrase ou le groupe extrait du texte",
  "question": "Analysez syntaxiquement [unité]",
  "theme": "Propositions subordonnées conjonctives",
  "correction_attendue": "Description syntaxique complète attendue"
}
`;
