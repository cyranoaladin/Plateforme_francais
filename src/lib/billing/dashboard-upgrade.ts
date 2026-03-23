import { toPublicPlanId } from '@/lib/billing/plan-catalog';

export type DashboardUpgradeState = {
  title: string;
  detail: string;
  cta: string;
};

export function getDashboardUpgradeState(planId: string | null | undefined): DashboardUpgradeState | null {
  if (!planId) {
    return null;
  }

  const publicPlanId = toPublicPlanId(planId);

  if (publicPlanId === 'MASTERIUM') {
    return null;
  }

  if (publicPlanId === 'PREMIUM') {
    return {
      title: 'Tu utilises le plan Premium — passe au Masterium pour un accès total.',
      detail: 'Le Masterium inclut l’historique complet, le support prioritaire et le parcours adaptatif avancé.',
      cta: 'Passer au Masterium',
    };
  }

  return {
    title: 'Tu utilises le plan Freemium — certains ateliers et ressources sont limités.',
    detail: 'Passe au Premium pour débloquer l’oral illimité, la bibliothèque complète et l’analyse de copies.',
    cta: 'Passer au Premium',
  };
}
