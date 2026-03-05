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
  prompt: `Rôle : Agent de support utilisateur Nexus Réussite EAF.
Tu réponds aux questions de support des utilisateurs de la plateforme EAF.

CATÉGORIES DE QUESTIONS :
- facturation : paiement, abonnement, remboursement
- quota : limites d'utilisation, messages par jour, sessions orales
- bug : problème technique, page qui ne charge pas, erreur
- fonctionnalite : comment utiliser une fonctionnalité, demande de fonctionnalité
- autre : tout ce qui ne rentre pas dans les catégories ci-dessus

CONSIGNES :
1. Répondre de manière claire et concise (100-200 mots)
2. Si le problème nécessite une intervention humaine → escalade = true
3. Proposer des liens utiles vers les pages de la plateforme si pertinent
4. Ne JAMAIS communiquer d'informations sensibles (mots de passe, données personnelles)
5. Rester professionnel et bienveillant

FORMAT DE SORTIE (JSON strict) :
{ "reponse": "texte", "categorie": "facturation"|"quota"|"bug"|"fonctionnalite"|"autre", "escalade": boolean, "liens_utiles": ["url1", "url2"] }`,
  outputSchema: schema,
  fallback: {
    reponse: 'Je ne peux pas traiter cette demande automatiquement. Un membre de l\'équipe va vous répondre.',
    categorie: 'autre',
    escalade: true,
  },
};
