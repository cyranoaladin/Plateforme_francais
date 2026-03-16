import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { BillingContextUnavailableError, getBillingContext } from '@/lib/billing/context';
import { PLAN_DISPLAY_LABELS } from '@/lib/billing/plan-catalog';
import { consumeQuota, QuotaExceededError as BillingQuotaExceededError } from '@/lib/billing/usage';
import { createMemoryEventRecord, listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { createCopie, findEpreuveById } from '@/lib/epreuves/repository';
import { runCorrectionWorker } from '@/lib/epreuves/worker';
import { evaluateBadges } from '@/lib/gamification/badges';
import { createMemoryEvent } from '@/lib/memory/store';
import { saveCopieFile } from '@/lib/storage/copies';
import { validateCsrf } from '@/lib/security/csrf';
import { InvalidFileTypeError, validateUpload } from '@/lib/security/file-validator';
import { checkRateLimit } from '@/lib/security/rate-limit';

/**
 * POST /api/v1/epreuves/{epreuveId}/copie
 * Content-Type: multipart/form-data
 * Response 202: { copieId, status: 'pending' }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ epreuveId: string }> },
) {
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
    key: `upload:${auth.user.id}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de soumissions. Réessayez dans 1 heure.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const { epreuveId } = await params;
  const epreuve = await findEpreuveById(epreuveId);

  if (!epreuve || epreuve.userId !== auth.user.id) {
    return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 });
  }

  const maxUploadMb = Number.parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? '20', 10);
  const maxBytes = (Number.isFinite(maxUploadMb) ? maxUploadMb : 20) * 1024 * 1024;

  if (file.size > maxBytes) {
    return NextResponse.json({ error: `Fichier trop volumineux (max ${maxUploadMb}MB).` }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let detected;
  try {
    detected = validateUpload(bytes, file.name);
  } catch (error) {
    if (error instanceof InvalidFileTypeError) {
      return NextResponse.json({ error: 'Type de fichier non supporté.' }, { status: 415 });
    }
    throw error;
  }

  let billing: Awaited<ReturnType<typeof getBillingContext>>;
  try {
    billing = await getBillingContext(auth.user.id);
  } catch (error) {
    if (error instanceof BillingContextUnavailableError) {
      return NextResponse.json(
        { error: 'La vérification de ton abonnement est momentanément indisponible. Réessaie dans quelques minutes.' },
        { status: 503 },
      );
    }
    throw error;
  }

  const writtenQuota = billing.config.quotas.WRITTEN_CORRECTIONS;
  if (writtenQuota) {
    try {
      await consumeQuota(auth.user.id, 'WRITTEN_CORRECTIONS', writtenQuota);
    } catch (error) {
      if (error instanceof BillingQuotaExceededError) {
        return NextResponse.json(
          {
            error: `Tu as atteint la limite incluse pour les corrections écrites (${error.limit} par mois, plan ${PLAN_DISPLAY_LABELS[billing.planId]}). Passe au plan supérieur pour lancer une nouvelle correction.`,
            code: 'QUOTA_EXCEEDED',
            upgradeUrl: '/pricing',
            plan: billing.planId,
          },
          { status: 402 },
        );
      }
      throw error;
    }
  }

  // Enforcement OCR_COPIES (limite le nombre de copies OCR par mois)
  const ocrQuota = billing.config.quotas.OCR_COPIES;
  if (ocrQuota) {
    try {
      await consumeQuota(auth.user.id, 'OCR_COPIES', ocrQuota);
    } catch (error) {
      if (error instanceof BillingQuotaExceededError) {
        return NextResponse.json(
          {
            error: `Tu as atteint la limite OCR (${error.limit} copies par mois, plan ${PLAN_DISPLAY_LABELS[billing.planId]}). Passe au plan supérieur pour analyser davantage de copies.`,
            code: 'QUOTA_EXCEEDED',
            upgradeUrl: '/pricing',
            plan: billing.planId,
          },
          { status: 402 },
        );
      }
      throw error;
    }
  }

  const saved = await saveCopieFile({
    userId: auth.user.id,
    fileType: detected.mime,
    bytes,
  });

  const copie = await createCopie({
    epreuveId,
    userId: auth.user.id,
    filePath: saved.filePath,
    fileType: saved.fileType,
  });

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'interaction',
      feature: 'copie_upload',
      path: '/atelier-ecrit',
      payload: {
        copieId: copie.id,
        epreuveId,
        fileType: saved.fileType,
      },
    }),
  );

  const timeline = await listMemoryEventsByUser(auth.user.id, 500);
  const badgeResult = evaluateBadges({
    profile: auth.user.profile,
    trigger: 'first_copy',
    timeline,
  });
  await updateUserProfile(auth.user.id, {
    ...auth.user.profile,
    badges: badgeResult.badges,
  });

  runCorrectionWorker(copie.id);

  return NextResponse.json(
    { copieId: copie.id, status: 'pending', newBadges: badgeResult.newBadges },
    { status: 202 },
  );
}
