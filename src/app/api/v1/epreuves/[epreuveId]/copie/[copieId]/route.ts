import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getUserSafeOcrText } from '@/lib/correction/ocr';
import { findCopieById, findEpreuveById } from '@/lib/epreuves/repository';

const COPIE_STATUS_API_MESSAGES = {
  unavailable: 'Ressource non disponible.',
} as const;

/**
 * GET /api/v1/epreuves/{epreuveId}/copie/{copieId}
 * Response: { copieId, status, correction?, ocrText?, createdAt, correctedAt }
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ epreuveId: string; copieId: string }> },
) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const { epreuveId, copieId } = await params;
  const epreuve = await findEpreuveById(epreuveId);
  const copie = await findCopieById(copieId);

  // ✅ MESSAGE GÉNÉRIQUE - Évite fuite d'information
  if (!epreuve || !copie || copie.epreuveId !== epreuve.id || copie.userId !== auth.user.id) {
    return NextResponse.json({ error: COPIE_STATUS_API_MESSAGES.unavailable }, { status: 404 });
  }

  return NextResponse.json(
    {
      copieId: copie.id,
      status: copie.status,
      correction: copie.correction,
      ocrText: getUserSafeOcrText(copie.ocrText),
      fileType: copie.fileType,
      createdAt: copie.createdAt,
      correctedAt: copie.correctedAt,
    },
    { status: 200 },
  );
}
