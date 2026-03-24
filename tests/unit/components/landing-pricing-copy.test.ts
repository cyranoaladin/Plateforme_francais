import { describe, expect, it } from 'vitest';
import { PUBLIC_PLAN_FEATURE_ROWS, PUBLIC_PLAN_OFFERS } from '@/lib/billing/public-offers';

describe('Landing pricing copy', () => {
  it('n expose pas de promesses de paiement ou de quotas contradictoires', () => {
    const free = PUBLIC_PLAN_OFFERS.find((offer) => offer.publicId === 'FREEMIUM');
    const premium = PUBLIC_PLAN_OFFERS.find((offer) => offer.publicId === 'PREMIUM');
    const analysesRow = PUBLIC_PLAN_FEATURE_ROWS.find((row) => row.label === 'Analyse de copies');

    expect(free?.landingBullets).toContain('2 / mois de correction écrite');
    expect(free?.landingBullets).not.toContain('3 corrections par mois');
    expect(premium?.footer).toContain('virement bancaire ou espèces');
    expect(premium?.landingBullets).toContain('Activation par code après règlement');
    expect(analysesRow?.values.FREEMIUM).toBe('2 / mois');
    expect(analysesRow?.values.PREMIUM).toBe('20 / mois');
    expect(analysesRow?.values.MASTERIUM).toBe('50 / mois');
  });
});
