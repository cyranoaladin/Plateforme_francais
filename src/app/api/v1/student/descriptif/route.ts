import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { descriptifUpsertSchema } from '@/lib/validation/schemas';

/**
 * GET /api/v1/student/descriptif
 * Returns the student's descriptif textes from the canonical TexteDescriptif table.
 */
export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse;

  const textes = await prisma.texteDescriptif.findMany({
    where: { userId: auth.user.id },
    orderBy: [{ objetEtude: 'asc' }, { position: 'asc' }],
    select: {
      id: true,
      objetEtude: true,
      oeuvreAuteur: true,
      typeTexte: true,
      titreExtrait: true,
      incipit: true,
    },
  });

  return NextResponse.json({
    textes: textes.map((texte) => ({
      id: texte.id,
      objetEtude: texte.objetEtude,
      oeuvre: texte.oeuvreAuteur,
      auteur: '',
      typeExtrait: texte.typeTexte,
      titre: texte.titreExtrait,
      premieresLignes: texte.incipit,
    })),
  });
}

/**
 * POST /api/v1/student/descriptif
 * Replaces all descriptif textes in the canonical TexteDescriptif table.
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse;

  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  const parsed = await parseJsonBody(request, descriptifUpsertSchema);
  if (!parsed.success) return parsed.response;

  await prisma.$transaction([
    prisma.texteDescriptif.deleteMany({ where: { userId: auth.user.id } }),
    ...parsed.data.textes.map((texte) =>
      prisma.texteDescriptif.create({
        data: {
          userId: auth.user.id,
          objetEtude: texte.objetEtude,
          typeTexte: texte.typeExtrait,
          oeuvreAuteur: texte.auteur ? `${texte.oeuvre} — ${texte.auteur}` : texte.oeuvre,
          titreExtrait: texte.titre,
          incipit: texte.premieresLignes ?? null,
        },
      }),
    ),
  ]);

  return NextResponse.json({ ok: true, count: parsed.data.textes.length });
}
