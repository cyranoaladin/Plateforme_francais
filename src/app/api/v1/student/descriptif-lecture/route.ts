import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { validateCsrf } from '@/lib/security/csrf';
import { z } from 'zod';

const TexteSchema = z.object({
  oeuvreAuteur: z.string().min(2).max(200),
  titreExtrait: z.string().min(2).max(500),
  incipit: z.string().max(1000).optional(),
  position: z.number().int().min(1).max(20).optional(),
});

const UpdateDescriptifSchema = z.object({
  textes: z.array(TexteSchema).max(20),
});

// GET : récupérer les textes préparés pour l'oral
export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const textes = await prisma.textePrepare.findMany({
    where: { userId: auth.user.id },
    orderBy: { position: 'asc' },
  });

  return NextResponse.json({ textes, total: textes.length });
}

// PUT : sauvegarder le descriptif complet (transactionnel)
export async function PUT(req: NextRequest) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json();
  const parsed = UpdateDescriptifSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.textePrepare.deleteMany({ where: { userId: auth.user.id } }),
    prisma.textePrepare.createMany({
      data: parsed.data.textes.map((t, i) => ({
        userId: auth.user.id,
        oeuvreAuteur: t.oeuvreAuteur,
        titreExtrait: t.titreExtrait,
        incipit: t.incipit ?? null,
        position: t.position ?? i + 1,
      })),
    }),
  ]);

  const saved = await prisma.textePrepare.findMany({
    where: { userId: auth.user.id },
    orderBy: { position: 'asc' },
  });

  return NextResponse.json({ textes: saved, total: saved.length });
}
