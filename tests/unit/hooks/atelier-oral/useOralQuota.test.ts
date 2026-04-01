import { describe, expect, it } from 'vitest';
import { resolveOralQuotaError } from '@/app/atelier-oral/hooks/useOralQuota';

describe('useOralQuota helpers', () => {
  it("récupère le message et l'upgradeUrl d'une réponse de quota", () => {
    expect(
      resolveOralQuotaError(
        {
          error: 'Quota atteint.',
          upgradeUrl: '/pricing',
        },
        'Erreur de secours.',
      ),
    ).toEqual({
      message: 'Quota atteint.',
      upgradeUrl: '/pricing',
    });
  });

  it("retombe sur le message de secours si la charge utile n'est pas exploitable", () => {
    expect(resolveOralQuotaError(null, 'Erreur de secours.')).toEqual({
      message: 'Erreur de secours.',
      upgradeUrl: null,
    });
  });
});
