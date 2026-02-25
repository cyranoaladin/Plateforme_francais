import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  reponse: z.string(),
  categorie: z.enum(['facturation', 'quota', 'bug', 'fonctionnalite', 'autre']),
  escalade: z.boolean(),
  liens_utiles: z.array(z.string()).optional(),
});

export type SupportProduitOutput = z.infer<typeof schema>;

export const supportProduitSkill: SkillConfig<SupportProduitOutput> = {
  prompt: 'Skill support_produit: répondre aux questions de support utilisateur (facturation, quotas, bugs, fonctionnalités). Escalader par email si nécessaire.',
  outputSchema: schema,
  fallback: {
    reponse: 'Je ne peux pas traiter cette demande automatiquement. Un membre de l\'équipe va vous répondre.',
    categorie: 'autre',
    escalade: true,
  },
};
