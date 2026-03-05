import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { findCopieById } from '@/lib/epreuves/repository';
import { resolveCopieAbsolutePath } from '@/lib/storage/copies';

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
  if (!copie || copie.userId !== auth.user.id) {
    return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
  }

  try {
    const absolutePath = resolveCopieAbsolutePath(copie.filePath);
    const data = await fs.readFile(absolutePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': copie.fileType,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fichier indisponible.' }, { status: 404 });
  }
}
