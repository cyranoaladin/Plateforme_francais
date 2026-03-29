/**
 * Bibliothèque freemium gating.
 * Freemium: accès limité à N ressources par catégorie (échantillons).
 * Premium/Masterium: accès complet.
 */

import { type PlanId, PLAN_CATALOG } from '@/lib/billing/plan-catalog';

/**
 * Nombre de ressources accessibles par catégorie pour le plan Freemium.
 * Cible : ~5 % du catalogue total (548 ressources → 28 accessibles).
 * Distribution proportionnelle au poids de chaque catégorie :
 *   Annales_EAF (27)          → 2
 *   Oeuvres (9)               → 1
 *   Videos (322)              → 16
 *   Documents_Extraits (160)  → 8
 *   eaf_rapport_jury (30)     → 1
 *   Total : 28 (~5,11 %)
 */
export const FREE_LIBRARY_LIMITS: Record<string, number> = {
  Annales_EAF: 2,
  Oeuvres: 1,
  Videos: 16,
  Documents_Extraits: 8,
  eaf_rapport_jury: 1,
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

/** Nombre total de ressources dans le catalogue. */
export const LIBRARY_TOTAL_RESOURCES = 548;

/** Pourcentage du catalogue accessible en FREE. */
export const FREE_LIBRARY_PERCENT = Math.round((FREE_TOTAL_LIMIT / LIBRARY_TOTAL_RESOURCES) * 100);

/**
 * Message paywall pour la bibliothèque.
 */
export function getLibraryPaywallMessage(planId: PlanId): string {
  if (planId === 'FREE') {
    return `Tu as accès à ${FREE_TOTAL_LIMIT} ressources sur ${LIBRARY_TOTAL_RESOURCES} (${FREE_LIBRARY_PERCENT} % du catalogue). Passe à Premium pour débloquer la bibliothèque complète.`;
  }
  return '';
}

/**
 * Construit l'index d'une ressource dans sa catégorie
 * à partir de la liste complète triée.
 */
export function getResourceIndexInCategory(
  resourceId: string,
  categoryResources: Array<{ id: string }>,
): number {
  return categoryResources.findIndex((r) => r.id === resourceId);
}
