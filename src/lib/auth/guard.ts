import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';

export async function requireAuthenticatedUser() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return {
      errorResponse: NextResponse.json({ error: 'Non authentifié.' }, { status: 401 }),
      auth: null,
    };
  }

  return { auth, errorResponse: null };
}

export async function requireUserRole(role: 'enseignant' | 'parent' | 'admin') {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return { auth: null, errorResponse };
  }

  const userRole = auth.user.role as string;
  if (userRole !== role && userRole !== 'admin') {
    return {
      auth: null,
      errorResponse: NextResponse.json({ error: 'Accès refusé.' }, { status: 403 }),
    };
  }

  return { auth, errorResponse: null };
}
