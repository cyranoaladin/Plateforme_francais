import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSessionActivity } from '@/lib/auth/session';
import { validateCsrf } from '@/lib/security/csrf';
import { logger } from '@/lib/logger';

/**
 * POST /api/v1/auth/refresh-session
 * Rafraîchit la session active de l'utilisateur.
 * Prolonge la durée de validité de la session sans nécessiter de re-connexion.
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification CSRF pour les routes mutatives avec cookie de session
    const csrfError = await validateCsrf(request);
    if (csrfError) {
      return NextResponse.json(
        { error: 'Token CSRF invalide ou manquant' },
        { status: 403 }
      );
    }

    const session = await getSession();
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Session invalide ou expirée' },
        { status: 401 }
      );
    }

    // Mettre à jour l'activité de la session (prolonge la durée de vie)
    await updateSessionActivity(session.userId);

    logger.info({ userId: session.userId }, 'auth.session_refreshed');

    return NextResponse.json({
      success: true,
      message: 'Session rafraîchie avec succès',
    });
  } catch (error) {
    logger.error({ error }, 'auth.refresh_session_error');
    return NextResponse.json(
      { error: 'Erreur lors du rafraîchissement de la session' },
      { status: 500 }
    );
  }
}
