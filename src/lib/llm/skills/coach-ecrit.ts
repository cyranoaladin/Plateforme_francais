import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  sujet: z.string(),
  texte: z.string(),
  consignes: z.string(),
  bareme: z.record(z.string(), z.number()),
  plan: z.array(z.string()).optional(),
  conseils: z.array(z.string()).optional(),
  vigilance: z.array(z.string()).optional(),
});

export type CoachEcritOutput = z.infer<typeof schema>;

export const coachEcritSkill: SkillConfig<CoachEcritOutput> = {
  prompt:
    'Skill coach_ecrit: générer un sujet EAF complet (texte support, consignes officielles, barème) et guider la méthodologie sans rédiger la copie.',
  outputSchema: schema,
  fallback: {
    sujet: "Expliquez comment le texte met en scène la tension entre l'individu et la société.",
    texte:
      "Dans la ville encore assoupie, Paul avançait d'un pas régulier, comme s'il voulait persuader les pavés qu'il avait choisi sa route.",
    consignes:
      "Vous traiterez ce sujet en 4 heures. Appuyez votre analyse sur le texte proposé et sur vos connaissances littéraires.",
    bareme: {
      comprehension: 4,
      analyse: 8,
      expression: 4,
      organisation: 4,
    },
    conseils: ['Annoncez un plan clair et justifiez chaque argument par le texte.'],
    vigilance: ['Ne paraphrasez pas: analysez les procédés et leurs effets.'],
  },
};
