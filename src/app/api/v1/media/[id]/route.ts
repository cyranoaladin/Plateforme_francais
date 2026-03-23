// src/app/api/v1/media/[id]/route.ts
// Route API authentifiée pour servir les fichiers médias locaux.
// Les agents ne doivent JAMAIS citer cette URL — ils citent [Ressource: titre].

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getBillingContext } from '@/lib/billing/context';
import { hasFullLibraryAccess, FREE_LIBRARY_LIMITS } from '@/lib/billing/library-gating';
import { RESSOURCES } from '@/data/ressources';
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

const RANGE_ENABLED_EXTENSIONS = new Set([
  '.mp4',
  '.webm',
  '.mkv',
  '.mov',
  '.mp3',
  '.wav',
  '.ogg',
  '.m4a',
  '.pdf',
]);

function buildBaseHeaders(absolutePath: string, contentType: string, size: number): Headers {
  const headers = new Headers({
    'Content-Type': contentType,
    'Content-Length': String(size),
    'Cache-Control': 'private, max-age=3600',
    'Content-Disposition': `inline; filename="${encodeURIComponent(path.basename(absolutePath))}"`,
  });

  if (RANGE_ENABLED_EXTENSIONS.has(path.extname(absolutePath).toLowerCase())) {
    headers.set('Accept-Ranges', 'bytes');
  }

  return headers;
}

function parseRangeHeader(rangeHeader: string, totalSize: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) {
    return null;
  }

  const [, startRaw, endRaw] = match;
  let start: number;
  let end: number;

  if (startRaw === '' && endRaw === '') {
    return null;
  }

  if (startRaw === '') {
    const suffixLength = Number(endRaw);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return null;
    }
    start = Math.max(totalSize - suffixLength, 0);
    end = totalSize - 1;
  } else {
    start = Number(startRaw);
    end = endRaw === '' ? totalSize - 1 : Number(endRaw);
  }

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= totalSize
  ) {
    return null;
  }

  end = Math.min(end, totalSize - 1);
  return { start, end };
}

/**
 * GET /api/v1/media/[id]
 * Sert le fichier média correspondant à l'entrée du catalogue.
 * Requiert une session utilisateur authentifiée.
 */
export async function GET(
  request: NextRequest,
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

  const billing = await getBillingContext(auth.user.id);
  if (!hasFullLibraryAccess(billing.planId)) {
    const normalizedPath = entry.filePath.replace(/^ressources\//, '');
    const matchedResource = RESSOURCES.find(
      (resource) => resource.url.replace(/^\/ressources\//, '') === normalizedPath,
    );

    if (!matchedResource) {
      logger.info({
        route: 'api/v1/media',
        userId: auth.user.id,
        plan: billing.planId,
        id,
        visibility: entry.visibility,
      }, 'media.freemium_blocked_unlisted');

      return NextResponse.json({
        error: 'Ressource réservée aux abonnés Premium ou Masterium.',
        code: 'LIBRARY_UPGRADE_REQUIRED',
        upgradeUrl: '/pricing',
      }, { status: 403 });
    }

    const categoryResources = RESSOURCES.filter((resource) => resource.category === matchedResource.category);
    const indexInCategory = categoryResources.findIndex((resource) => resource.id === matchedResource.id);
    const limit = FREE_LIBRARY_LIMITS[matchedResource.category] ?? 2;

    if (indexInCategory >= limit) {
      logger.info({
        route: 'api/v1/media',
        userId: auth.user.id,
        plan: billing.planId,
        id,
        resource: matchedResource.id,
        category: matchedResource.category,
      }, 'media.freemium_blocked');

      return NextResponse.json({
        error: 'Ressource réservée aux abonnés Premium ou Masterium.',
        code: 'LIBRARY_UPGRADE_REQUIRED',
        upgradeUrl: '/pricing',
      }, { status: 403 });
    }
  }

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
    const rangeHeader = request.headers.get('range');
    const baseHeaders = buildBaseHeaders(absolutePath, contentType, stat.size);

    if (rangeHeader && RANGE_ENABLED_EXTENSIONS.has(ext)) {
      const range = parseRangeHeader(rangeHeader, stat.size);
      if (!range) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${stat.size}`,
          },
        });
      }

      const chunk = fileBuffer.subarray(range.start, range.end + 1);
      const headers = new Headers(baseHeaders);
      headers.set('Content-Length', String(chunk.byteLength));
      headers.set('Content-Range', `bytes ${range.start}-${range.end}/${stat.size}`);

      return new NextResponse(chunk, {
        status: 206,
        headers,
      });
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: baseHeaders,
    });
  } catch (error: unknown) {
    logger.error({ route: 'api/v1/media', id, error }, 'media.read_error');
    return NextResponse.json({ error: 'Erreur de lecture du fichier.' }, { status: 500 });
  }
}
