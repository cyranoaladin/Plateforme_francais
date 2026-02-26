import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { prisma } from '@/lib/db/client';

/** DELETE /api/v1/carnet/:entryId — delete a single carnet entry (IDOR-guarded) */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse!;

  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  const { entryId } = await params;

  const profile = await prisma.studentProfile.findUnique({ where: { userId: auth.user.id } });
  if (!profile) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });

  const entry = await prisma.carnetEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.studentId !== profile.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.carnetEntry.delete({ where: { id: entryId } });
  return NextResponse.json({ ok: true });
}
