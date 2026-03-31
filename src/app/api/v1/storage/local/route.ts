import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), '.data', 'uploads');

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Non disponible en production.' }, { status: 403 });
  }

  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse ?? NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Clé manquante.' }, { status: 400 });
  }

  const filePath = path.resolve(LOCAL_UPLOADS_DIR, key);
  if (!filePath.startsWith(LOCAL_UPLOADS_DIR)) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(key).toLowerCase();
    const mimeType = ext === '.pdf' ? 'application/pdf' : 'text/html; charset=utf-8';
    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
  }
}
