import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { findCopieById, findEpreuveById } from '@/lib/epreuves/repository';

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
    return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
  }

  return NextResponse.json(
    {
      copieId: copie.id,
      status: copie.status,
      correction: copie.correction,
      ocrText: copie.ocrText,
      fileType: copie.fileType,
      createdAt: copie.createdAt,
      correctedAt: copie.correctedAt,
    },
    { status: 200 },
  );
}
