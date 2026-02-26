import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { updateOeuvreChoisieSchema } from '@/lib/validation/schemas';

/**
 * PUT /api/v1/student/oeuvre-choisie
 * Update the student's chosen work for the oral exam part 2 (entretien /8).
 */
export async function PUT(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse!;

  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  const parsed = await parseJsonBody(request, updateOeuvreChoisieSchema);
  if (!parsed.success) return parsed.response;

  await updateUserProfile(auth.user.id, {
    ...auth.user.profile,
    oeuvreChoisieEntretien: parsed.data.oeuvreChoisieEntretien,
  });

  return NextResponse.json({ ok: true });
}
