import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { orchestrate } from '@/lib/llm/orchestrator';
import { createMemoryEvent } from '@/lib/memory/store';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/security/csrf';
import { sanitizeString } from '@/lib/security/sanitize';
import { parseJsonBody } from '@/lib/validation/request';
import { onboardingCompleteBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/onboarding/complete
 * Body: onboarding wizard payload
 *
 * RÈGLE FAIL-SAFE : une erreur dans l'auto-évaluation (étape 3),
 * la génération du message de bienvenue ou le memory event ne doit
 * JAMAIS empêcher la création du compte. On log + continue.
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
    voie: parsed.data.voie ?? (parsed.data.classLevel.toLowerCase().includes('techno') ? 'TECHNOLOGIQUE' : 'GENERALE'),
    establishment: parsed.data.establishment
      ? sanitizeString(parsed.data.establishment, { maxLength: 200, allowHtml: false })
      : undefined,
    eafDate: parsed.data.eafDate,
    selectedOeuvres: parsed.data.selectedOeuvres,
    oeuvreChoisieEntretien: parsed.data.oeuvreChoisieEntretien ?? undefined,
    classCode: parsed.data.classCode,
    weakSignals: parsed.data.weakSignals,
    oeuvresEntretien: parsed.data.oeuvresEntretien,
    lecturesCursives: parsed.data.lecturesCursives ?? [],
  };

  const nextWeak = Array.from(new Set([
    ...(auth.user.profile?.weakSkills ?? []),
    ...(sanitizedData.weakSignals ?? [])
  ]));
  const primaryWorkId = sanitizedData.oeuvreChoisieEntretien ?? sanitizedData.selectedOeuvres?.[0] ?? 'douai';
  const defaultWelcome = `Bonjour ${sanitizedData.displayName} ! Voici ton plan de révision pour être prêt(e) le ${sanitizedData.eafDate}.`;

  // --- Étape critique : sauvegarder le profil (onboardingCompleted = true) ---
  try {
    await updateUserProfile(auth.user.id, {
      ...auth.user.profile,
      displayName: sanitizedData.displayName ?? auth.user.profile?.displayName ?? 'Élève',
      classLevel: sanitizedData.classLevel ?? auth.user.profile?.classLevel ?? 'Première générale',
      voie: sanitizedData.voie as 'GENERALE' | 'TECHNOLOGIQUE',
      establishment: sanitizedData.establishment ?? auth.user.profile?.establishment,
      eafDate: sanitizedData.eafDate ?? auth.user.profile?.eafDate,
      selectedOeuvres: sanitizedData.selectedOeuvres ?? auth.user.profile?.selectedOeuvres ?? [],
      classCode: sanitizedData.classCode ?? auth.user.profile?.classCode,
      onboardingCompleted: true,
      weakSkills: nextWeak,
      lecturesCursives: sanitizedData.lecturesCursives ?? auth.user.profile?.lecturesCursives ?? [],
    });
  } catch (profileError) {
    logger.error({ userId: auth.user.id, err: profileError }, 'onboarding.profileSave.failed');
    return NextResponse.json(
      { ok: false, error: 'Impossible de sauvegarder le profil. Réessaie.' },
      { status: 500 },
    );
  }

  // --- Étape non-critique : memory event (fail-safe) ---
  try {
    await createMemoryEventRecord(
      createMemoryEvent(auth.user.id, {
        type: 'interaction',
        feature: 'onboarding_complete',
        payload: { weakSkills: nextWeak },
      }),
    );
  } catch (memoryError) {
    logger.warn({ userId: auth.user.id, err: memoryError }, 'onboarding.memoryEvent.failed — continuing');
  }

  // --- Étape non-critique : message de bienvenue LLM (fail-safe) ---
  let welcomeMessage = defaultWelcome;
  try {
    const orchestrateResult = await orchestrate({
      skill: 'tuteur_libre',
      userId: auth.user.id,
      workId: primaryWorkId,
      userQuery: `Rédige un message de bienvenue personnalisé pour ${sanitizedData.displayName}.`,
      context: `Date EAF : ${sanitizedData.eafDate}. Œuvres : ${sanitizedData.selectedOeuvres.join(', ')}. Signaux prioritaires : ${nextWeak.join(', ') || 'aucun signal prioritaire'}.`,
    });
    const message = orchestrateResult as { answer?: string };
    welcomeMessage = message.answer ?? defaultWelcome;
  } catch (llmError) {
    logger.warn({ userId: auth.user.id, err: llmError }, 'onboarding.welcomeMessage.failed — using default');
  }

  return NextResponse.json({ ok: true, welcomeMessage }, { status: 200 });
}
