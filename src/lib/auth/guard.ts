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

export async function requireExactUserRole(role: 'enseignant' | 'parent' | 'admin') {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return { auth: null, errorResponse };
  }

  const userRole = auth.user.role as string;
  if (userRole !== role) {
    return {
      auth: null,
      errorResponse: NextResponse.json({ error: 'Accès refusé.' }, { status: 403 }),
    };
  }

  return { auth, errorResponse: null };
}

export async function requireEleve() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return { auth: null, errorResponse };
  }
  const role = auth.user.role as string;
  if (role !== 'eleve' && role !== 'admin') {
    return {
      auth: null,
      errorResponse: NextResponse.json({ error: 'Accès réservé aux élèves.' }, { status: 403 }),
    };
  }
  return { auth, errorResponse: null };
}

/**
 * H6: Guard for routes requiring verified email (premium features).
 * Allows admin to bypass.
 */
export async function requireVerifiedEmail() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return { auth: null, errorResponse };
  }
  const role = auth.user.role as string;
  if (role === 'admin') {
    return { auth, errorResponse: null };
  }
  if (!auth.user.emailVerified) {
    return {
      auth: null,
      errorResponse: NextResponse.json(
        { error: 'Vérifie ton adresse email pour accéder à cette fonctionnalité.', code: 'EMAIL_NOT_VERIFIED' },
        { status: 403 },
      ),
    };
  }
  return { auth, errorResponse: null };
}
