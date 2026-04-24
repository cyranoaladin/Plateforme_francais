import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/security/csrf';
import { indexerTexteDescriptif, supprimerTexteDescriptifRAG } from '@/lib/rag/indexer';
import { z } from 'zod';

const patchSchema = z.object({
  objetEtude: z.enum(['POESIE', 'THEATRE', 'LITTERATURE_IDEES', 'ROMAN_RECIT']).optional(),
  typeTexte: z.enum(['EXTRAIT_OEUVRE', 'EXTRAIT_PARCOURS', 'LECTURE_CURSIVE', 'OEUVRE_CHOISIE_ENTRETIEN']).optional(),
  oeuvreAuteur: z.string().min(2).max(300).optional(),
  titreExtrait: z.string().min(1).max(500).optional(),
  incipit: z.string().max(2000).optional().nullable(),
  numeroPagesRef: z.string().max(50).optional().nullable(),
  position: z.number().int().min(1).max(30).optional(),
  contenuTexte: z.string().max(50000).optional().nullable(),
  parcourAssocie: z.string().max(200).optional().nullable(),
  mouvements: z.array(z.object({
    debut: z.string().min(1).max(100),
    fin: z.string().min(1).max(100),
    titre: z.string().min(1).max(200),
  })).max(12).optional().nullable(),
  notesPersonnelles: z.string().max(5000).optional().nullable(),
});

type RouteContext = {
  params: Promise<{ texteId: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(req);
  if (csrfError) {
    return csrfError;
  }

  const { texteId } = await context.params;

  const existing = await prisma.texteDescriptif.findFirst({
    where: { id: texteId, userId: auth.user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Texte non trouvé.' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = {
    ...parsed.data,
    ...(parsed.data.mouvements !== undefined
      ? {
          mouvements: parsed.data.mouvements && parsed.data.mouvements.length > 0
            ? JSON.parse(JSON.stringify(parsed.data.mouvements))
            : null,
        }
      : {}),
  };

  const texte = await prisma.texteDescriptif.update({
    where: { id: texteId },
    data,
  });

  // Ré-indexation RAG asynchrone si le contenu a changé
  if (texte.contenuTexte && texte.contenuTexte.trim().length > 50) {
    indexerTexteDescriptif({
      texteDescriptifId: texte.id,
      studentId: auth.user.id,
      contenu: texte.contenuTexte,
      metadata: {
        titre: texte.titreExtrait,
        auteur: texte.oeuvreAuteur,
        typeTexte: texte.typeTexte,
        oeuvreNom: texte.oeuvreAuteur,
      },
    }).catch((err: unknown) =>
      logger.warn({ texteId: texte.id, err }, 'rag.indexer.descriptif.patch_failed')
    );
  }

  return NextResponse.json({ texte });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(req);
  if (csrfError) {
    return csrfError;
  }

  const { texteId } = await context.params;

  const existing = await prisma.texteDescriptif.findFirst({
    where: { id: texteId, userId: auth.user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Texte non trouvé.' }, { status: 404 });
  }

  await prisma.texteDescriptif.delete({ where: { id: texteId } });

  // Suppression RAG asynchrone
  supprimerTexteDescriptifRAG(texteId).catch((err: unknown) =>
    logger.warn({ texteId, err }, 'rag.indexer.descriptif.delete_failed')
  );

  return NextResponse.json({ success: true });
}
