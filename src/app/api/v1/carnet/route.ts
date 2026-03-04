import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { carnetEntrySchema } from '@/lib/validation/schemas';
import { prisma } from '@/lib/db/client';

/** GET /api/v1/carnet?oeuvre=xxx — read carnet entries, optionally filtered by oeuvre */
export async function GET(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse!;

  const profile = await prisma.studentProfile.findUnique({ where: { userId: auth.user.id } });
  if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const oeuvreFilter = searchParams.get('oeuvre');

  const entries = await prisma.carnetEntry.findMany({
    where: {
      studentId: profile.id,
      ...(oeuvreFilter ? { oeuvre: oeuvreFilter } : {}),
    },
    orderBy: [{ oeuvre: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ entries });
}

/** POST /api/v1/carnet — add a new carnet entry */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse!;

  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  const parsed = await parseJsonBody(request, carnetEntrySchema);
  if (!parsed.success) return parsed.response;

  const profile = await prisma.studentProfile.findUnique({ where: { userId: auth.user.id } });
  if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });

  const entry = await prisma.carnetEntry.create({
    data: {
      studentId: profile.id,
      oeuvre: parsed.data.oeuvre,
      auteur: parsed.data.auteur,
      type: parsed.data.type,
      contenu: parsed.data.contenu,
      page: parsed.data.page ?? null,
      tags: parsed.data.tags ?? [],
    },
  });

  return NextResponse.json({ ok: true, entry }, { status: 201 });
}
