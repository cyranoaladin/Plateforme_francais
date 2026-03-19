import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { descriptifUpsertSchema } from '@/lib/validation/schemas';

/**
 * GET /api/v1/student/descriptif
 * Returns the student's descriptif textes from the DescriptifTexte table.
 */
export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: auth.user.id },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ textes: [] });
  }

  const textes = await prisma.descriptifTexte.findMany({
    where: { studentId: profile.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      objetEtude: true,
      oeuvre: true,
      auteur: true,
      typeExtrait: true,
      titre: true,
      premieresLignes: true,
    },
  });

  return NextResponse.json({ textes });
}

/**
 * POST /api/v1/student/descriptif
 * Replaces all descriptif textes (delete + insert) in the DescriptifTexte table.
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse;

  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  const parsed = await parseJsonBody(request, descriptifUpsertSchema);
  if (!parsed.success) return parsed.response;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: auth.user.id },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });
  }

  // Replace all: delete existing + insert new
  await prisma.$transaction([
    prisma.descriptifTexte.deleteMany({ where: { studentId: profile.id } }),
    ...parsed.data.textes.map((texte) =>
      prisma.descriptifTexte.create({
        data: {
          studentId: profile.id,
          objetEtude: texte.objetEtude,
          oeuvre: texte.oeuvre,
          auteur: texte.auteur,
          typeExtrait: texte.typeExtrait,
          titre: texte.titre,
          premieresLignes: texte.premieresLignes ?? null,
        },
      }),
    ),
  ]);

  return NextResponse.json({ ok: true, count: parsed.data.textes.length });
}
