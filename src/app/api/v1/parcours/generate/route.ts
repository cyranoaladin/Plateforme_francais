import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { orchestrate } from '@/lib/llm/orchestrator';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { parcoursGenerateBodySchema } from '@/lib/validation/schemas';

type Plan = {
  semaines: {
    numero: number;
    objectif: string;
    activites: { type: string; titre: string; duree: string; lien: string }[];
  }[];
};

function sequenceForMonth(month: number): { objectif: string; activites: Plan['semaines'][number]['activites'] } {
  if (month >= 8 && month <= 9) {
    return {
      objectif: 'Lancer la dynamique de lecture (septembre-octobre)',
      activites: [
        { type: 'lecture', titre: 'Fiches de lecture du 1er objet d\u2019étude', duree: '30 min', lien: '/bibliotheque' },
        { type: 'oral', titre: 'Lecture expressive /2', duree: '20 min', lien: '/atelier-oral' },
        { type: 'quiz', titre: 'Quiz repères d\u2019œuvre', duree: '15 min', lien: '/quiz' },
      ],
    };
  }
  if (month >= 10 && month <= 11) {
    return {
      objectif: 'Couvrir la moitié du programme + Cyclades (novembre-décembre)',
      activites: [
        { type: 'organisation', titre: 'Checklist inscription Cyclades', duree: '15 min', lien: '/mon-parcours' },
        { type: 'ecrit', titre: 'Premier commentaire rédigé', duree: '45 min', lien: '/atelier-ecrit' },
        { type: 'oral', titre: 'Simulation explication linéaire', duree: '25 min', lien: '/atelier-oral' },
      ],
    };
  }
  if (month <= 1) {
    return {
      objectif: 'Renforcer grammaire et commentaires (janvier-février)',
      activites: [
        { type: 'grammaire', titre: 'Relations logiques et subordination', duree: '25 min', lien: '/atelier-langue' },
        { type: 'ecrit', titre: 'Commentaire structuré en 3 mouvements', duree: '45 min', lien: '/atelier-ecrit' },
        { type: 'quiz', titre: 'Quiz figures de style', duree: '15 min', lien: '/quiz' },
      ],
    };
  }
  if (month >= 2 && month <= 3) {
    return {
      objectif: 'Entraînements intensifs dissertation + oral (mars-avril)',
      activites: [
        { type: 'ecrit', titre: 'Plan de dissertation en temps limité', duree: '40 min', lien: '/atelier-ecrit' },
        { type: 'oral', titre: 'Simulation complète 12 + 8', duree: '30 min', lien: '/atelier-oral' },
        { type: 'revisions', titre: 'Révision citations utiles', duree: '20 min', lien: '/bibliotheque' },
      ],
    };
  }
  if (month === 4) {
    return {
      objectif: 'Finaliser les objets d\u2019étude et consolider (mai)',
      activites: [
        { type: 'oral', titre: 'Lecture + grammaire en continu', duree: '25 min', lien: '/atelier-oral' },
        { type: 'ecrit', titre: 'Sujet blanc complet', duree: '60 min', lien: '/atelier-ecrit' },
        { type: 'fiches', titre: 'Synthèse parcours par œuvre', duree: '20 min', lien: '/bibliotheque' },
      ],
    };
  }
  return {
    objectif: 'Consolidation finale vers épreuves de juin',
    activites: [
      { type: 'oral', titre: 'Oral intensif : lecture + explication + entretien', duree: '30 min', lien: '/atelier-oral' },
      { type: 'ecrit', titre: 'Mémorisation citations et plans', duree: '25 min', lien: '/atelier-ecrit' },
      { type: 'quiz', titre: 'Quiz final grammaire', duree: '15 min', lien: '/quiz' },
    ],
  };
}

/**
 * POST /api/v1/parcours/generate
 * Body: { forceRegenerate?: boolean }
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, parcoursGenerateBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const now = new Date();
  const month = now.getMonth();
  const sequence = sequenceForMonth(month);
  const primaryWorkId = auth.user.profile.selectedOeuvres?.[0];

  let generated: { weeks?: Array<{ weekNumber: number; tasks: Array<{ oeuvre: string; competence: string; dureeMinutes: number; priorite: string }> }> } | undefined;
  try {
    generated = (await orchestrate({
      skill: 'sr_planner',
      userId: auth.user.id,
      workId: primaryWorkId,
      userQuery: `Génère un plan de révision EAF sur 4 semaines. Faiblesses de l'élève : ${auth.user.profile.weakSkills.join(', ') || 'aucune précisée'}. Séquence prioritaire : ${sequence.objectif}.`,
      context: `Date du jour : ${now.toISOString().slice(0, 10)}. Objectif : ${sequence.objectif}. Œuvres choisies : ${auth.user.profile.selectedOeuvres?.join(', ') || 'non précisées'}.`,
    })) as typeof generated;
  } catch (err) {
    console.error('[parcours/generate] orchestrate error:', err instanceof Error ? err.message : err);
  }

  const plan: Plan = {
    semaines: generated?.weeks && generated.weeks.length > 0
      ? generated.weeks.map((w) => ({
          numero: w.weekNumber,
          objectif: sequence.objectif,
          activites: w.tasks.map((t) => ({
            type: t.competence,
            titre: `${t.oeuvre} — ${t.competence}`,
            duree: `${t.dureeMinutes} min`,
            lien: sequence.activites[0]?.lien ?? '/mon-parcours',
          })),
        }))
      : Array.from({ length: 4 }, (_, idx) => ({
          numero: idx + 1,
          objectif: sequence.objectif,
          activites: sequence.activites,
        })),
  };

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'interaction',
      feature: 'parcours_generate',
      payload: {
        weekCount: plan.semaines.length,
        primaryWorkId: primaryWorkId ?? 'none',
      },
    }),
  );

  return NextResponse.json(plan, { status: 200 });
}
