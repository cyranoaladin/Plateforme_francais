import { renderToBuffer } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { findCopieById, findEpreuveById } from '@/lib/epreuves/repository';
import { CorrectionReportPdf } from '@/lib/epreuves/report-pdf';

/**
 * GET /api/v1/epreuves/copies/{copieId}/report
 * Response: application/pdf
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ copieId: string }> },
) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const { copieId } = await params;
  const copie = await findCopieById(copieId);
  if (!copie || copie.userId !== auth.user.id || !copie.correction) {
    return NextResponse.json({ error: 'Rapport indisponible.' }, { status: 404 });
  }

  const epreuve = await findEpreuveById(copie.epreuveId);
  if (!epreuve) {
    return NextResponse.json({ error: 'Épreuve introuvable.' }, { status: 404 });
  }

  const buffer = await renderToBuffer(CorrectionReportPdf({ copie, epreuve }));
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rapport-correction-${copieId}.pdf"`,
    },
  });
}
