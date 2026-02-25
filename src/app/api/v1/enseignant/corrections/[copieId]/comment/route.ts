import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { teacherCorrectionCommentBodySchema } from '@/lib/validation/schemas';

/**
 * @route POST /api/v1/enseignant/corrections/{copieId}/comment
 * @description Ajoute un commentaire enseignant manuel sur une correction IA.
 */
export async function POST(request: Request, context: { params: Promise<{ copieId: string }> }) {
  const { auth, errorResponse } = await requireUserRole('enseignant');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, teacherCorrectionCommentBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({ error: 'Commentaire manuel indisponible sans base PostgreSQL.' }, { status: 503 });
  }

  const { copieId } = await context.params;

  const copy = await prisma.copieDeposee.findUnique({
    where: { id: copieId },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!copy) {
    return NextResponse.json({ error: 'Copie introuvable.' }, { status: 404 });
  }

  const teacherClassCode = auth.user.profile?.classCode ?? null;
  const studentClassCode = copy.user.profile?.classCode ?? null;

  if (!teacherClassCode || teacherClassCode !== studentClassCode) {
    return NextResponse.json(
      { error: 'Copie hors de votre classe ou code classe non configuré.' },
      { status: 403 },
    );
  }

  const correction = (typeof copy.correction === 'object' && copy.correction ? copy.correction : {}) as Record<string, unknown>;
  const nextCorrection = {
    ...correction,
    commentaireEnseignant: parsed.data.comment,
  };

  await prisma.copieDeposee.update({
    where: { id: copieId },
    data: {
      correction: nextCorrection,
    },
  });

  return NextResponse.json({ ok: true, commentaireEnseignant: parsed.data.comment }, { status: 200 });
}
