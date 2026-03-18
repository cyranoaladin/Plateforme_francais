import { NextResponse } from 'next/server';
import { RESSOURCES_DATA } from '@/data/ressources';

/**
 * API endpoint pour le catalogue des ressources
 * 
 * GET /api/v1/ressources
 * Retourne le catalogue complet des ressources avec métadonnées
 */
export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(RESSOURCES_DATA, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error serving resources catalog:', error);
    return NextResponse.json(
      { error: 'Catalogue des ressources indisponible.' },
      { status: 500 }
    );
  }
}
