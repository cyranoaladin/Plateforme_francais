import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { renderHtmlDocumentPdf } from '@/lib/pdf/document-html-pdf';
import { getUploadsBaseDir } from '@/lib/storage/paths';

const LOCAL_UPLOADS_DIR = path.resolve(getUploadsBaseDir());

function decodeStorageKey(paramsKey: string[]): string {
  return paramsKey.map((segment) => decodeURIComponent(segment)).join('/');
}

function resolveLocalDocumentPath(storageKey: string): string {
  return path.join(LOCAL_UPLOADS_DIR, storageKey);
}

async function readLocalDocument(storageKey: string): Promise<string | null> {
  try {
    return await fs.readFile(resolveLocalDocumentPath(storageKey), 'utf8');
  } catch {
    return null;
  }
}

async function getDocumentOwnership(userId: string, storageKey: string) {
  return prisma.documentDeposit.findFirst({
    where: {
      storageKey,
      profile: {
        userId,
      },
    },
    select: {
      filename: true,
      fileType: true,
      storageKey: true,
    },
  });
}

function createS3Client() {
  return new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse ?? NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const storageKey = decodeStorageKey((await params).key);
  const document = await getDocumentOwnership(auth.user.id, storageKey);
  if (!document) {
    return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
  }

  const wantsPdf =
    storageKey.endsWith('.pdf')
    || request.nextUrl.pathname.endsWith('.pdf')
    || request.headers.get('accept')?.includes('application/pdf');

  if (process.env.STORAGE_PROVIDER === 's3') {
    const client = createS3Client();
    if (wantsPdf && document.fileType === 'html') {
      const object = await client.send(new GetObjectCommand({
        Bucket: process.env.S3_BUCKET || 'eaf-platform',
        Key: storageKey,
      }));
      const html = await object.Body?.transformToString('utf8');
      if (!html) {
        return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
      }
      const pdf = await renderHtmlDocumentPdf(document.filename, html);
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${document.filename.replace(/\.html$/i, '.pdf')}"`,
        },
      });
    }

    const signedUrl = await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET || 'eaf-platform',
        Key: storageKey,
      }),
      { expiresIn: 600 },
    );
    return NextResponse.redirect(signedUrl);
  }

  const html = await readLocalDocument(storageKey);
  if (!html) {
    return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
  }

  if (wantsPdf && document.fileType === 'html') {
    const pdf = await renderHtmlDocumentPdf(document.filename, html);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.filename.replace(/\.html$/i, '.pdf')}"`,
      },
    });
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${document.filename}"`,
    },
  });
}
