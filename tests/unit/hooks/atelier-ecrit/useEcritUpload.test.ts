import { describe, expect, it } from 'vitest';
import { normaliseUploadFailure } from '@/app/atelier-ecrit/hooks/useEcritUpload';

describe('useEcritUpload helpers', () => {
  it("préserve l'upgradeUrl quand l'upload échoue sur un quota", () => {
    const error = new Error('Quota atteint.') as Error & { upgradeUrl?: string };
    error.upgradeUrl = '/pricing';

    expect(normaliseUploadFailure(error)).toEqual({
      message: 'Quota atteint.',
      upgradeUrl: '/pricing',
    });
  });
});
