import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { orchestrate } from '@/lib/llm/orchestrator';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { sanitizeString } from '@/lib/security/sanitize';
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

  // ✅ SANITIZATION des inputs utilisateur
  const sanitizedData = {
    displayName: sanitizeString(parsed.data.displayName, { maxLength: 100, allowHtml: false }),
    classLevel: sanitizeString(parsed.data.classLevel, { maxLength: 50, allowHtml: false }),
    establishment: parsed.data.establishment
      ? sanitizeString(parsed.data.establishment, { maxLength: 200, allowHtml: false })
      : undefined,
    eafDate: parsed.data.eafDate,
    selectedOeuvres: parsed.data.selectedOeuvres,
    classCode: parsed.data.classCode,
    weakSignals: parsed.data.weakSignals,
  };

  const nextWeak = Array.from(new Set([...auth.user.profile.weakSkills, ...sanitizedData.weakSignals]));

  await updateUserProfile(auth.user.id, {
    ...auth.user.profile,
    displayName: sanitizedData.displayName,
    classLevel: sanitizedData.classLevel,
    establishment: sanitizedData.establishment,
    eafDate: sanitizedData.eafDate,
    selectedOeuvres: sanitizedData.selectedOeuvres,
    classCode: sanitizedData.classCode,
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

  const message = (await orchestrate({
    skill: 'tuteur_libre',
    userId: auth.user.id,
    userQuery: `Rédige un message de bienvenue personnalisé pour ${sanitizedData.displayName}.`,
    context: `Date EAF: ${sanitizedData.eafDate}. Oeuvres: ${sanitizedData.selectedOeuvres.join(', ')}.`,
  })) as { answer?: string };

  return NextResponse.json(
    {
      ok: true,
      welcomeMessage:
        message.answer ??
        `Bonjour ${sanitizedData.displayName} ! Voici ton plan de révision pour être prêt(e) le ${sanitizedData.eafDate}.`,
    },
    { status: 200 },
  );
}
