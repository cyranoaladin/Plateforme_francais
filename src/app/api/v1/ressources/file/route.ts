import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { logger } from '@/lib/logger';
import { createMemoryEvent } from '@/lib/memory/store';
import { getBillingContext } from '@/lib/billing/context';
import { hasFullLibraryAccess, FREE_LIBRARY_LIMITS } from '@/lib/billing/library-gating';
import { RESSOURCES } from '@/data/ressources';

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
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.doc': 'application/msword',
  '.ppsx': 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  '.html': 'text/plain; charset=utf-8',
  '.php': 'text/plain; charset=utf-8',
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

function buildBaseHeaders(absolutePath: string, contentType: string, size: number, shouldDownload: boolean): Headers {
  const headers = new Headers({
    'Content-Type': contentType,
    'Content-Length': String(size),
    'Cache-Control': 'private, max-age=3600',
    'Content-Disposition': `${shouldDownload ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(path.basename(absolutePath))}`,
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse ?? NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const requestedPath = request.nextUrl.searchParams.get('path');
  if (!requestedPath) {
    return NextResponse.json({ error: 'Chemin de ressource manquant.' }, { status: 400 });
  }
  const shouldDownload = request.nextUrl.searchParams.get('download') === '1';

  if (requestedPath.includes('\0')) {
    logger.warn({ route: 'api/v1/ressources/file', requestedPath }, 'resource_file.null_byte_rejected');
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const ressourcesRoot = path.resolve(process.cwd(), 'ressources');
  const normalizedPath = requestedPath.replace(/^\/+/, '');
  const absolutePath = path.resolve(ressourcesRoot, normalizedPath);

  // ── Gating freemium bibliothèque ──
  const billing = await getBillingContext(auth.user.id);
  if (!hasFullLibraryAccess(billing.planId)) {
    // Trouver la ressource dans le catalogue
    const matchedResource = RESSOURCES.find(r => {
      const rPath = r.url.replace(/^\/ressources\//, '');
      return rPath === normalizedPath;
    });

    if (matchedResource) {
      // Calculer l'index de cette ressource dans sa catégorie
      const categoryResources = RESSOURCES.filter(r => r.category === matchedResource.category);
      const indexInCategory = categoryResources.findIndex(r => r.id === matchedResource.id);
      const limit = FREE_LIBRARY_LIMITS[matchedResource.category] ?? 2;

      if (indexInCategory >= limit) {
        logger.info({
          userId: auth.user.id,
          plan: billing.planId,
          resource: matchedResource.id,
          category: matchedResource.category,
        }, 'resource_file.freemium_blocked');

        return NextResponse.json({
          error: 'Ressource reservee aux abonnes Pro ou Max.',
          code: 'LIBRARY_UPGRADE_REQUIRED',
          upgradeUrl: '/pricing',
        }, { status: 403 });
      }
    }
  }

  if (!absolutePath.startsWith(`${ressourcesRoot}${path.sep}`)) {
    logger.warn({ route: 'api/v1/ressources/file', requestedPath, absolutePath }, 'resource_file.path_traversal_blocked');
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  try {
    const stat = await fs.lstat(absolutePath);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      logger.warn({ route: 'api/v1/ressources/file', absolutePath }, 'resource_file.not_regular_file');
      return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
    const fileBuffer = await fs.readFile(absolutePath);
    const rangeHeader = request.headers.get('range');
    const baseHeaders = buildBaseHeaders(absolutePath, contentType, stat.size, shouldDownload);

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

      if (range.start === 0) {
        await createMemoryEventRecord(
          createMemoryEvent(auth.user.id, {
            type: 'resource',
            feature: shouldDownload ? 'resource_download' : 'resource_open',
            path: '/bibliotheque',
            payload: {
              file: normalizedPath,
              extension: ext,
              mode: shouldDownload ? 'download' : 'open',
            },
          }),
        );
      }

      return new NextResponse(chunk, {
        status: 206,
        headers,
      });
    }

    await createMemoryEventRecord(
      createMemoryEvent(auth.user.id, {
        type: 'resource',
        feature: shouldDownload ? 'resource_download' : 'resource_open',
        path: '/bibliotheque',
        payload: {
          file: normalizedPath,
          extension: ext,
          mode: shouldDownload ? 'download' : 'open',
        },
      }),
    );

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: baseHeaders,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      logger.warn({ route: 'api/v1/ressources/file', requestedPath }, 'resource_file.not_found');
      return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
    }

    logger.error({ route: 'api/v1/ressources/file', requestedPath, error }, 'resource_file.read_error');
    return NextResponse.json({ error: 'Erreur de lecture du fichier.' }, { status: 500 });
  }
}
