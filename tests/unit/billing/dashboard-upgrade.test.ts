import { describe, expect, it } from 'vitest';

import { getDashboardUpgradeState } from '@/lib/billing/dashboard-upgrade';

describe('getDashboardUpgradeState', () => {
  it('suggests Premium for freemium accounts', () => {
    expect(getDashboardUpgradeState('FREEMIUM')).toEqual({
      title: 'Tu utilises le plan Freemium — certains ateliers et ressources sont limités.',
      detail: 'Passe au Premium pour travailler jusqu’à 10 oraux par semaine, débloquer la bibliothèque complète et analyser davantage de copies.',
      cta: 'Passer au Premium',
    });
  });

  it('suggests Masterium for premium accounts', () => {
    expect(getDashboardUpgradeState('PREMIUM')).toEqual({
      title: 'Tu utilises le plan Premium — passe au Masterium pour un accès total.',
      detail: 'Le Masterium inclut l’historique complet, le support prioritaire et le parcours adaptatif avancé.',
      cta: 'Passer au Masterium',
    });
  });

  it('hides the upgrade banner for Masterium aliases', () => {
    expect(getDashboardUpgradeState('MASTERIUM')).toBeNull();
    expect(getDashboardUpgradeState('PRO')).toBeNull();
  });
});
