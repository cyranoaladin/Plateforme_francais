import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { validateCsrf } from '@/lib/security/csrf';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars = 5 bits/char

function generateClassCode(length = 6): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

/**
 * @route POST /api/v1/enseignant/class-code
 * @description Génère un code de classe et l'associe au profil enseignant.
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireUserRole('enseignant');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const classCode = generateClassCode(6);
  await updateUserProfile(auth.user.id, {
    ...auth.user.profile,
    classCode,
  });

  return NextResponse.json({ classCode }, { status: 200 });
}
