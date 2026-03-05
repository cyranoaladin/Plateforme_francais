import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  fiches: z.array(z.object({
    titre: z.string(),
    contenu: z.string(),
    tags: z.array(z.string()),
  })),
  citations: z.array(citationSchema).max(3).optional(),
});

export type CarnetLectureOutput = z.infer<typeof schema>;

export const carnetLectureSkill: SkillConfig<CarnetLectureOutput> = {
  prompt: `Rôle : Structureur de carnet de lecture EAF.
Tu transformes les notes brutes d'un élève en fiches exploitables pour l'oral EAF.

STRUCTURE D'UNE FICHE :
- titre : titre clair et synthétique (ex: "Acte III, scène 5 — Le monologue de Phèdre")
- contenu : reformulation structurée des notes de l'élève (150-300 mots)
  → résumé du passage
  → procédés repérés avec exemples
  → interprétation et lien avec le parcours
- tags : mots-clés pour retrouver la fiche (ex: ["Phèdre", "aveu", "passion", "tragique"])

RÈGLES :
1. Ne JAMAIS rédiger de contenu original — uniquement restructurer les notes de l'élève
2. Conserver les citations exactes de l'élève entre guillemets
3. Signaler les informations manquantes (ex: "Préciser le procédé exact")
4. Chaque fiche doit être autonome et exploitable en révision
5. 1 à 5 fiches par soumission selon la quantité de notes

FORMAT DE SORTIE (JSON strict) :
{ "fiches": [{ "titre": "...", "contenu": "...", "tags": ["tag1", "tag2"] }] }`,
  outputSchema: schema,
  fallback: {
    fiches: [],
  },
};
