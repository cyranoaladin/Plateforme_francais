import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { createCopie, findEpreuveById } from '@/lib/epreuves/repository';
import { runCorrectionWorker } from '@/lib/epreuves/worker';
import { evaluateBadges } from '@/lib/gamification/badges';
import { saveCopieFile } from '@/lib/storage/copies';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { copieUploadMetaSchema } from '@/lib/validation/schemas';

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
    return NextResponse.json({ error: 'Épreuve introuvable.' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 });
  }

  const maxUploadMb = Number.parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? '20', 10);
  const maxBytes = (Number.isFinite(maxUploadMb) ? maxUploadMb : 20) * 1024 * 1024;

  const validation = copieUploadMetaSchema.safeParse({
    fileType: file.type,
    fileSize: file.size,
  });

  if (!validation.success) {
    return NextResponse.json({ error: 'Type de fichier non supporté.' }, { status: 400 });
  }

  if (file.size > maxBytes) {
    return NextResponse.json({ error: `Fichier trop volumineux (max ${maxUploadMb}MB).` }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const saved = await saveCopieFile({
    userId: auth.user.id,
    fileType: file.type,
    bytes,
  });

  const copie = await createCopie({
    epreuveId,
    userId: auth.user.id,
    filePath: saved.filePath,
    fileType: saved.fileType,
  });

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
