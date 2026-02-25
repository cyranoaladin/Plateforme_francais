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

  const generated = (await orchestrate({
    skill: 'tuteur_libre',
    userId: auth.user.id,
    userQuery: 'Génère un plan de révision hebdomadaire en JSON.',
    context: `Faiblesses: ${auth.user.profile.weakSkills.join(', ')}. Date EAF: ${auth.user.profile.eafDate ?? 'non renseignée'}.`,
  })) as { semaines?: Plan['semaines'] };

  const fallback: Plan = {
    semaines: Array.from({ length: 4 }, (_, idx) => ({
      numero: idx + 1,
      objectif: `Renforcer ${auth.user.profile.weakSkills[idx % Math.max(auth.user.profile.weakSkills.length, 1)] ?? 'les fondamentaux EAF'}`,
      activites: [
        { type: 'oral', titre: 'Simulation orale guidée', duree: '30 min', lien: '/atelier-oral' },
        { type: 'ecrit', titre: 'Entraînement écrit', duree: '45 min', lien: '/atelier-ecrit' },
        { type: 'quiz', titre: 'Quiz thématique', duree: '20 min', lien: '/quiz' },
      ],
    })),
  };

  const plan: Plan = {
    semaines:
      generated.semaines && generated.semaines.length > 0
        ? generated.semaines
        : fallback.semaines,
  };

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'interaction',
      feature: 'parcours_generate',
      payload: {
        weekCount: plan.semaines.length,
      },
    }),
  );

  return NextResponse.json(plan, { status: 200 });
}
