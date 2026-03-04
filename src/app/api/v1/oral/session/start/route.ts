import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createOralSession } from '@/lib/oral/repository';
import { pickOralExtrait } from '@/lib/oral/service';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { requirePlan, incrementUsage } from '@/lib/billing/gating';
import { parseJsonBody } from '@/lib/validation/request';
import { oralSessionStartBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/oral/session/start
 * Body: { oeuvre, extrait?, questionGrammaire? }
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

  const rl = await checkRateLimit({
    request,
    key: `oral:start:${auth.user.id}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de sessions orales. Réessayez dans 1 heure.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const gate = await requirePlan(auth.user.id, 'oralSessionsPerMonth');
  if (!gate.allowed) {
    return NextResponse.json(
      { error: 'Quota de sessions orales atteint. Passez à un plan premium.', upgradeUrl: gate.upgradeUrl },
      { status: 403 },
    );
  }

  const parsed = await parseJsonBody(request, oralSessionStartBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const selected = pickOralExtrait(parsed.data.oeuvre);
  const texte = parsed.data.extrait ?? selected.texte;
  const questionGrammaire = parsed.data.questionGrammaire ?? selected.questionGrammaire;
  const phraseGrammaire = selected.phraseGrammaire;
  const oeuvreChoisie = auth.user.profile.selectedOeuvres?.[0] ?? parsed.data.oeuvre;

  const session = await createOralSession({
    userId: auth.user.id,
    oeuvre: oeuvreChoisie,
    extrait: texte,
    questionGrammaire,
  });

  await incrementUsage(auth.user.id, 'oralSessionsPerMonth');

  return NextResponse.json(
    {
      sessionId: session.id,
      texte,
      questionGrammaire,
      phraseGrammaire,
      oeuvreChoisie,
      instructions:
        'Suivez les 4 etapes officielles: lecture (2 min), explication (8 min), grammaire (2 min), entretien (8 min sur l oeuvre choisie).',
    },
    { status: 200 },
  );
}
