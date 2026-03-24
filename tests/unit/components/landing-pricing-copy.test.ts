import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Landing pricing copy', () => {
  it('n expose pas de promesses de paiement ou de quotas contradictoires', () => {
    const file = path.resolve(process.cwd(), 'src/components/landing/PricingSection.tsx');
    const src = fs.readFileSync(file, 'utf8');

    expect(src).not.toContain('3 corrections par mois');
    expect(src).not.toContain('Corrections illimitées');
    expect(src).not.toContain('coaching en visio');
    expect(src).not.toContain('prorata est calculé automatiquement');
    expect(src).not.toContain('Sans engagement');
    expect(src).not.toContain('Résiliation immédiate');

    expect(src).toContain('2 corrections écrites / mois');
    expect(src).toContain('virement bancaire');
    expect(src).toContain('code d’activation');
  });
});
