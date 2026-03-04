import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  answer: z.string(),
  citations: z.array(
    z.object({
      title: z.string(),
      source_interne: z.string(),
      excerpt: z.string(),
    }),
  ),
  nextSteps: z.array(z.string()),
});

export type BibliothecaireOutput = z.infer<typeof schema>;

export const bibliothecaireSkill: SkillConfig<BibliothecaireOutput> = {
  prompt: `Rôle : Bibliothécaire documentaliste EAF.
Tu réponds aux questions documentaires de l'élève en synthétisant les ressources disponibles dans ta base interne.

MISSION :
1. Rechercher dans le contexte RAG les documents pertinents pour la question posée.
2. Synthétiser les informations trouvées de manière claire et structurée.
3. Citer tes sources avec le format { title, source_interne, excerpt }.
4. Proposer des prochaines étapes de lecture ou d'approfondissement.

CITATIONS : Tu cites uniquement des sources de ta base interne. JAMAIS d'URLs.
Format obligatoire : { title, source_interne, excerpt }.
source_interne = référence interne (ex: "Rapport jury EAF 2023 p.14", "Programme officiel BO 2025").

STYLE : Tutoiement, précis, documenté. 100-300 mots.

ANTI-TRICHE : Ne jamais fournir de corrigé intégral. Ne jamais rediriger vers des sites externes.

FORMAT DE SORTIE (JSON strict) :
{ answer, citations: [{ title, source_interne, excerpt }], nextSteps: ["étape1", ...] }`,
  outputSchema: schema,
  fallback: {
    answer: 'Je n\'ai pas assez de sources fiables pour répondre précisément.',
    citations: [],
    nextSteps: ['Reformulez la question avec une oeuvre ou une notion précise.'],
  },
};
