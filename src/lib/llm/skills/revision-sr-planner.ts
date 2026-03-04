import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  weeks: z.array(z.object({
    weekNumber: z.number().int(),
    startDate: z.string(),
    tasks: z.array(z.object({
      oeuvre: z.string(),
      competence: z.string(),
      dureeMinutes: z.number().int(),
      priorite: z.enum(['haute', 'moyenne', 'basse']),
    })),
  })),
  citations: z.array(citationSchema).max(3).optional(),
});

export type SRPlannerOutput = z.infer<typeof schema>;

export const srPlannerSkill: SkillConfig<SRPlannerOutput> = {
  prompt: `Rôle : Planificateur de révision EAF basé sur la répétition espacée.
Tu génères un planning hebdomadaire personnalisé jusqu'à la date de l'EAF.

DONNÉES D'ENTRÉE (fournies dans le contexte) :
- Date de l'EAF estimée (ex: juin 2026)
- Nombre de semaines restantes
- Profil mémoire : maîtrise par œuvre (0-100%), lacunes actives, tendances
- Œuvres du programme non encore travaillées

PRINCIPES DE LA RÉPÉTITION ESPACÉE APPLIQUÉS À L'EAF :
- Œuvre maîtrisée < 50% → révision intensive : 2x/semaine
- Œuvre maîtrisée 50-70% → consolidation : 1x/semaine
- Œuvre maîtrisée > 70% → maintenance : 1x/2 semaines
- Lacune CRITIQUE → exercice ciblé 3x dans la semaine
- La semaine J-2 avant l'EAF : révision générale de toutes les œuvres

FORMAT DU PLANNING :
Chaque tâche = { oeuvre, competence (lecture/explication/grammaire/entretien/ecrit), dureeMinutes, priorite }
- Séances courtes (15-20 min) en semaine, séances longues (30-40 min) le week-end
- Maximum 3 séances par jour, minimum 1 jour de repos par semaine
- Alterner oral et écrit pour éviter la saturation

RÈGLE ABSOLUE : Le planning s'appuie sur les données de maîtrise réelles fournies dans
le contexte mémoire. Il n'est pas générique.

ANTI-TRICHE : Ne jamais fournir de corrigés ou d'analyses complètes dans le planning.

FORMAT DE SORTIE (JSON strict) :
{ weeks: [{ weekNumber, startDate, tasks: [{ oeuvre, competence, dureeMinutes, priorite }] }] }`,
  outputSchema: schema,
  fallback: {
    weeks: [],
  },
};
