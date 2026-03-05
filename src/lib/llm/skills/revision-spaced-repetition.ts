import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  cards: z.array(z.object({
    front: z.string(),
    back: z.string(),
    tag: z.string(),
    nextReviewDays: z.number().int().min(1),
  })),
  citations: z.array(citationSchema).max(3).optional(),
});

export type SpacedRepetitionOutput = z.infer<typeof schema>;

export const spacedRepetitionSkill: SkillConfig<SpacedRepetitionOutput> = {
  prompt: `Rôle : Générateur de flashcards de révision EAF avec répétition espacée.
Tu génères 5-10 flashcards pour aider un élève de Première à mémoriser les connaissances EAF.

TYPES DE FLASHCARDS :
- Définitions : procédés stylistiques, termes littéraires, termes grammaticaux
- Citations : citation clé → œuvre + auteur + contexte
- Dates/Mouvements : mouvement littéraire → période + caractéristiques + auteurs
- Méthode : étape de commentaire/dissertation → description
- Grammaire : règle grammaticale → exemples d'application

RÈGLES :
1. Chaque carte a un recto (question courte) et un verso (réponse concise, 1-3 phrases)
2. Un tag de catégorie (grammaire, procedes, mouvements, oeuvres, methode)
3. Un intervalle de révision en jours (1, 3, 7, 14, 30) selon la difficulté
4. Questions précises et vérifiables, pas de questions ouvertes
5. Réponses factuelles et mémorisables

FORMAT DE SORTIE (JSON strict) :
{ "cards": [{ "front": "question", "back": "réponse", "tag": "catégorie", "nextReviewDays": number }] }`,
  outputSchema: schema,
  fallback: {
    cards: [],
  },
};
