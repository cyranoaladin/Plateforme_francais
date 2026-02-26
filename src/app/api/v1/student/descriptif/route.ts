import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { descriptifUpsertSchema, type DescriptifTexteItem } from '@/lib/validation/schemas';
import { prisma } from '@/lib/db/client';

/**
 * Validate the descriptif against official EAF rules.
 * Returns an array of warning strings (empty = fully compliant).
 */
function validateDescriptifRules(textes: DescriptifTexteItem[]): string[] {
  const warnings: string[] = [];
  const total = textes.length;
  if (total < 20) warnings.push(`Total insuffisant : ${total} textes (minimum 20).`);

  const byObjet: Record<string, number> = { poesie: 0, roman: 0, theatre: 0, litterature_idees: 0 };
  const byOeuvre: Record<string, number> = {};
  const byParcours: Record<string, number> = {};

  for (const t of textes) {
    byObjet[t.objetEtude] = (byObjet[t.objetEtude] ?? 0) + 1;
    const key = `${t.objetEtude}__${t.oeuvre}`;
    if (t.typeExtrait === 'extrait_oeuvre') {
      byOeuvre[key] = (byOeuvre[key] ?? 0) + 1;
    } else {
      byParcours[key] = (byParcours[key] ?? 0) + 1;
    }
  }

  for (const [objet, count] of Object.entries(byObjet)) {
    if (count < 5) warnings.push(`Objet d'étude "${objet}" : ${count} textes (minimum 5).`);
  }
  for (const [key, count] of Object.entries(byOeuvre)) {
    const label = key.split('__')[1];
    if (count < 3) warnings.push(`Œuvre "${label}" : ${count} extraits d'œuvre (minimum 3).`);
  }
  for (const [key, count] of Object.entries(byParcours)) {
    const label = key.split('__')[1];
    if (count < 2) warnings.push(`Parcours de "${label}" : ${count} extraits (minimum 2).`);
  }

  return warnings;
}

/** GET /api/v1/student/descriptif — read the student's descriptif */
export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse!;

  const profile = await prisma.studentProfile.findUnique({ where: { userId: auth.user.id } });
  if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });

  const textes = await prisma.descriptifTexte.findMany({
    where: { studentId: profile.id },
    orderBy: [{ objetEtude: 'asc' }, { oeuvre: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json({ textes });
}

/** POST /api/v1/student/descriptif — replace the entire descriptif (upsert) */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse!;

  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  const parsed = await parseJsonBody(request, descriptifUpsertSchema);
  if (!parsed.success) return parsed.response;

  const profile = await prisma.studentProfile.findUnique({ where: { userId: auth.user.id } });
  if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });

  const warnings = validateDescriptifRules(parsed.data.textes);

  await prisma.$transaction([
    prisma.descriptifTexte.deleteMany({ where: { studentId: profile.id } }),
    prisma.descriptifTexte.createMany({
      data: parsed.data.textes.map((t) => ({
        studentId: profile.id,
        objetEtude: t.objetEtude,
        oeuvre: t.oeuvre,
        auteur: t.auteur,
        typeExtrait: t.typeExtrait,
        titre: t.titre,
        premieresLignes: t.premieresLignes ?? null,
      })),
    }),
  ]);

  return NextResponse.json({ ok: true, count: parsed.data.textes.length, warnings });
}

/** DELETE /api/v1/student/descriptif — delete the entire descriptif */
export async function DELETE(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse!;

  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  const profile = await prisma.studentProfile.findUnique({ where: { userId: auth.user.id } });
  if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });

  await prisma.descriptifTexte.deleteMany({ where: { studentId: profile.id } });
  return NextResponse.json({ ok: true });
}
