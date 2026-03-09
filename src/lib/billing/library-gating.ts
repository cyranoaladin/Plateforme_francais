/**
 * Bibliothèque freemium gating.
 * FREE: accès limité à N ressources par catégorie (échantillons).
 * PRO/MAX: accès complet.
 */

import { type PlanId, PLAN_CATALOG } from '@/lib/billing/plan-catalog';

/** Nombre de ressources visibles par catégorie pour le plan FREE. */
export const FREE_LIBRARY_LIMITS: Record<string, number> = {
  Annales_EAF: 3,
  Oeuvres: 2,
  Videos: 5,
  Documents_Extraits: 3,
  eaf_rapport_jury: 2,
};

/** Nombre total de ressources accessibles en FREE. */
export const FREE_TOTAL_LIMIT = Object.values(FREE_LIBRARY_LIMITS).reduce((a, b) => a + b, 0);

/**
 * Vérifie si un plan a l'accès complet à la bibliothèque.
 */
export function hasFullLibraryAccess(planId: PlanId): boolean {
  return PLAN_CATALOG[planId]?.flags?.LIBRARY_FULL_ACCESS === true;
}

/**
 * Retourne le nombre max de ressources visibles pour une catégorie donnée.
 * -1 = illimité (accès complet).
 */
export function getLibraryLimit(planId: PlanId, category: string): number {
  if (hasFullLibraryAccess(planId)) return -1;
  return FREE_LIBRARY_LIMITS[category] ?? 2;
}

/**
 * Vérifie si une ressource spécifique est accessible pour un plan donné.
 * Les ressources sont ordonnées par ID — les N premières de chaque catégorie sont accessibles en FREE.
 */
export function isResourceAccessible(
  planId: PlanId,
  resourceId: string,
  category: string,
  indexInCategory: number,
): boolean {
  if (hasFullLibraryAccess(planId)) return true;
  const limit = FREE_LIBRARY_LIMITS[category] ?? 2;
  return indexInCategory < limit;
}

/**
 * Message paywall pour la bibliothèque.
 */
export function getLibraryPaywallMessage(planId: PlanId): string {
  if (planId === 'FREE') {
    return 'Tu as acces a un echantillon de ressources par categorie. Passe a Pro ou Max pour debloquer les 553 ressources de la bibliotheque complete.';
  }
  return '';
}
