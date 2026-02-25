import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { ensureCsrfCookie } from '@/lib/security/csrf';

export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const response = NextResponse.json(
    {
      id: auth.user.id,
      email: auth.user.email,
      role: auth.user.role,
      profile: auth.user.profile,
    },
    { status: 200 },
  );
  await ensureCsrfCookie(response);
  return response;
}
