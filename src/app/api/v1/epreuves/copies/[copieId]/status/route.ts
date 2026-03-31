import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getUserSafeOcrText } from '@/lib/correction/ocr';
import { normalizeCorrectionPayload } from '@/lib/correction/normalize-correction';
import { findCopieById } from '@/lib/epreuves/repository';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ copieId: string }> },
) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (errorResponse) return errorResponse;
  if (!auth) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { copieId } = await params;
  const copie = await findCopieById(copieId);

  if (!copie || copie.userId !== auth.user.id) {
    return NextResponse.json({ error: 'Copie introuvable.' }, { status: 404 });
  }

  return NextResponse.json(
    {
      copieId: copie.id,
      epreuveId: copie.epreuveId,
      status: copie.status,
      correction: copie.status === 'done' ? normalizeCorrectionPayload(copie.correction) : copie.correction,
      ocrText: getUserSafeOcrText(copie.ocrText),
      fileType: copie.fileType,
      createdAt: copie.createdAt,
      correctedAt: copie.correctedAt,
    },
    { status: 200 },
  );
}
