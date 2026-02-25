import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { type StudentProfile } from '@/lib/auth/types';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { studentProfileBodySchema } from '@/lib/validation/schemas';

export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  return NextResponse.json(auth.user.profile, { status: 200 });
}

export async function PUT(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, studentProfileBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const nextProfile: StudentProfile = {
    ...auth.user.profile,
    ...parsed.data,
    eafDate: parsed.data.eafDate ?? auth.user.profile.eafDate,
    selectedOeuvres: parsed.data.selectedOeuvres ?? auth.user.profile.selectedOeuvres,
    parcoursProgress: parsed.data.parcoursProgress ?? auth.user.profile.parcoursProgress,
    preferredObjects: parsed.data.preferredObjects ?? auth.user.profile.preferredObjects,
    weakSkills: parsed.data.weakSkills ?? auth.user.profile.weakSkills,
  };

  await updateUserProfile(auth.user.id, nextProfile);

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'interaction',
      feature: 'profile_update',
    }),
  );

  return NextResponse.json(nextProfile, { status: 200 });
}
