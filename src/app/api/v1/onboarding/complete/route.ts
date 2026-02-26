import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { orchestrate } from '@/lib/llm/orchestrator';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { onboardingCompleteBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/onboarding/complete
 * Body: onboarding wizard payload
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

  const parsed = await parseJsonBody(request, onboardingCompleteBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const nextWeak = Array.from(new Set([...auth.user.profile.weakSkills, ...parsed.data.weakSignals]));

  await updateUserProfile(auth.user.id, {
    ...auth.user.profile,
    displayName: parsed.data.displayName,
    classLevel: parsed.data.classLevel,
    establishment: parsed.data.establishment,
    eafDate: parsed.data.eafDate,
    selectedOeuvres: parsed.data.selectedOeuvres,
    oeuvreChoisieEntretien: parsed.data.oeuvreChoisieEntretien ?? undefined,
    classCode: parsed.data.classCode,
    onboardingCompleted: true,
    weakSkills: nextWeak,
  });

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'interaction',
      feature: 'onboarding_complete',
      payload: {
        weakSkills: nextWeak,
      },
    }),
  );

  const orchestrateResult = await orchestrate({
    skill: 'tuteur_libre',
    userId: auth.user.id,
    userQuery: `Rédige un message de bienvenue personnalisé pour ${parsed.data.displayName}.`,
    context: `Date EAF: ${parsed.data.eafDate}. Oeuvres: ${parsed.data.selectedOeuvres.join(', ')}.`,
  });
  const message = orchestrateResult.output as { answer?: string };

  return NextResponse.json(
    {
      ok: true,
      welcomeMessage:
        message.answer ??
        `Bonjour ${parsed.data.displayName} ! Voici ton plan de révision pour être prêt(e) le ${parsed.data.eafDate}.`,
    },
    { status: 200 },
  );
}
