// src/app/api/v1/media/[id]/route.ts
// Route API authentifiée pour servir les fichiers médias locaux.
// Les agents ne doivent JAMAIS citer cette URL — ils citent [Ressource: titre].

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { MEDIA_CATALOG } from '@/data/media-catalog';
import { logger } from '@/lib/logger';
import { isWithinRessourcesRoot, resolveCatalogFilePath } from '@/lib/ressources/path';

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.pdf': 'application/pdf',
};

/**
 * GET /api/v1/media/[id]
 * Sert le fichier média correspondant à l'entrée du catalogue.
 * Requiert une session utilisateur authentifiée.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // Auth guard
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse ?? NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { id } = await params;

  // Lookup in catalog
  const entry = MEDIA_CATALOG.find((m) => m.id === id);
  if (!entry) {
    logger.warn({ route: 'api/v1/media', id }, 'media.not_found');
    return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
  }

  const absolutePath = resolveCatalogFilePath(entry.filePath);

  // Security: reject null bytes in the id (prevents poison-null-byte attacks)
  if (id.includes('\0')) {
    logger.error({ route: 'api/v1/media', id }, 'media.null_byte_rejected');
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  if (!isWithinRessourcesRoot(absolutePath)) {
    logger.error({ route: 'api/v1/media', id, absolutePath }, 'media.path_traversal_blocked');
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  try {
    // Security: use lstat to detect symlinks, then verify it's a regular file
    const stat = await fs.lstat(absolutePath);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      logger.warn({ route: 'api/v1/media', id }, 'media.not_regular_file');
      return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

    const fileBuffer = await fs.readFile(absolutePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stat.size),
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': `inline; filename="${encodeURIComponent(path.basename(absolutePath))}"`,
      },
    });
  } catch (error: unknown) {
    logger.error({ route: 'api/v1/media', id, error }, 'media.read_error');
    return NextResponse.json({ error: 'Erreur de lecture du fichier.' }, { status: 500 });
  }
}
