import { describe, it, expect } from 'vitest';
import { amountForUpgradeMillimes } from '@/lib/payments/clictopay';

describe('Upgrade & Multi-month pricing', () => {
  describe('amountForUpgradeMillimes', () => {
    it('Premium → Masterium = 30 000 millimes (1 mois)', () => {
      expect(amountForUpgradeMillimes('PREMIUM', 'PRO', 1)).toBe(30_000);
    });

    it('Premium → Masterium × 3 mois = 90 000 millimes', () => {
      expect(amountForUpgradeMillimes('PREMIUM', 'PRO', 3)).toBe(90_000);
    });

    it('Premium → Masterium × 12 mois = 360 000 millimes', () => {
      expect(amountForUpgradeMillimes('PREMIUM', 'PRO', 12)).toBe(360_000);
    });

    it('Masterium → Premium = 0 (pas de downgrade payant)', () => {
      expect(amountForUpgradeMillimes('PRO', 'PREMIUM', 1)).toBe(0);
    });

    it('Premium → Premium = 0 (même plan)', () => {
      expect(amountForUpgradeMillimes('PREMIUM', 'PREMIUM', 1)).toBe(0);
    });

    it('default months = 1', () => {
      expect(amountForUpgradeMillimes('PREMIUM', 'PRO')).toBe(30_000);
    });
  });
});
