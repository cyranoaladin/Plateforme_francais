import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { extractTextFromCopie, getUserSafeOcrText } from '@/lib/correction/ocr';
import { logger } from '@/lib/logger';
import { indexerTexteDescriptif } from '@/lib/rag/indexer';
import { validateCsrf } from '@/lib/security/csrf';
import { InvalidFileTypeError, validateUpload } from '@/lib/security/file-validator';
import { getStorageProvider } from '@/lib/storage/provider';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

type RouteContext = {
  params: Promise<{ texteId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(req);
  if (csrfError) {
    return csrfError;
  }

  const { texteId } = await context.params;
  const texte = await prisma.texteDescriptif.findFirst({
    where: { id: texteId, userId: auth.user.id },
  });
  if (!texte) {
    return NextResponse.json({ error: 'Texte non trouvé.' }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo).' }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  let mime: string;
  let safeName: string;
  try {
    const validated = validateUpload(bytes, file.name);
    mime = validated.mime;
    safeName = validated.safeName;
  } catch (error) {
    if (error instanceof InvalidFileTypeError) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé (${error.detectedMime}).` },
        { status: 400 },
      );
    }
    throw error;
  }

  const storage = getStorageProvider();
  const storageKey = `descriptif/${auth.user.id}/${texteId}/${Date.now()}-${safeName}`;
  await storage.uploadFile(storageKey, bytes, mime);

  let contenuTexte: string | null = null;
  try {
    const extracted = await extractTextFromCopie({ bytes, mimeType: mime });
    contenuTexte = getUserSafeOcrText(extracted);
  } catch (error) {
    logger.warn({ error, texteId }, 'descriptif.lecture.upload.ocr_failed');
  }

  const updated = await prisma.texteDescriptif.update({
    where: { id: texteId },
    data: {
      fichierPath: storageKey,
      fichierType: mime,
      ...(contenuTexte ? { contenuTexte } : {}),
    },
  });

  // Indexation RAG asynchrone si le texte a été extrait
  if (updated.contenuTexte && updated.contenuTexte.trim().length > 50) {
    indexerTexteDescriptif({
      texteDescriptifId: updated.id,
      studentId: auth.user.id,
      contenu: updated.contenuTexte,
      metadata: {
        titre: updated.titreExtrait,
        auteur: updated.oeuvreAuteur,
        typeTexte: updated.typeTexte,
        oeuvreNom: updated.oeuvreNom ?? updated.titreExtrait ?? null,
      },
    }).catch((err: unknown) =>
      logger.warn({ texteId: updated.id, err }, 'descriptif.lecture.upload.rag_failed')
    );
  }

  return NextResponse.json({
    texte: updated,
    ocrExtracted: Boolean(contenuTexte),
  });
}
