import { renderToBuffer } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';
import { CarnetExportPdf, type CarnetEntryPdf } from '@/lib/carnet/pdf';

export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const events = await listMemoryEventsByUser(auth.user.id, 1000);
  const entries: CarnetEntryPdf[] = events
    .filter((e) => e.feature === 'carnet_entry' && e.type === 'resource')
    .map((e) => ({
      oeuvre: String(e.payload?.oeuvre ?? ''),
      type: (String(e.payload?.type ?? 'note') as CarnetEntryPdf['type']),
      contenu: String(e.payload?.contenu ?? ''),
      page: typeof e.payload?.page === 'string' ? e.payload.page : undefined,
      tags: Array.isArray(e.payload?.tags) ? (e.payload?.tags as string[]) : undefined,
      createdAt: e.createdAt,
    }))
    .filter((e) => e.oeuvre && e.contenu)
    .slice(0, 300);

  const buffer = await renderToBuffer(CarnetExportPdf({
    entries,
    studentName: auth.user.profile.displayName,
  }));

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="carnet-lecture-eaf.pdf"',
    },
  });
}
