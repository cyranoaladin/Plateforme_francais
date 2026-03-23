import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getBillingContext } from '@/lib/billing/context';
import { getResourceIndexInCategory, isResourceAccessible } from '@/lib/billing/library-gating';
import { RESSOURCES, RESSOURCES_DATA, getRessourcesByCategory } from '@/data/ressources';

type SafeResourceCatalogEntry = Omit<(typeof RESSOURCES)[number], 'filePath' | 'url'> & {
  locked: boolean;
};

function buildSafeCatalog(planId: Awaited<ReturnType<typeof getBillingContext>>['planId']) {
  const resources: SafeResourceCatalogEntry[] = RESSOURCES.map((resource) => {
    const categoryResources = getRessourcesByCategory(resource.category);
    const indexInCategory = getResourceIndexInCategory(resource.id, categoryResources);
    const accessible = isResourceAccessible(planId, resource.id, resource.category, indexInCategory);
    const safeResource = Object.fromEntries(
      Object.entries(resource).filter(([key]) => key !== 'filePath' && key !== 'url'),
    ) as Omit<(typeof RESSOURCES)[number], 'filePath' | 'url'>;

    return {
      ...safeResource,
      locked: !accessible,
    };
  });

  return {
    generatedAt: RESSOURCES_DATA.generatedAt,
    totalResources: RESSOURCES_DATA.totalResources,
    byCategory: RESSOURCES_DATA.byCategory,
    resources,
  };
}

/**
 * API endpoint pour le catalogue des ressources
 * 
 * GET /api/v1/ressources
 * Retourne le catalogue authentifié des ressources sans exposer les chemins internes.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { auth, errorResponse } = await requireAuthenticatedUser();
    if (!auth || errorResponse) {
      return errorResponse ?? NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const billing = await getBillingContext(auth.user.id);
    const safeCatalog = buildSafeCatalog(billing.planId);

    return NextResponse.json(safeCatalog, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=300',
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
