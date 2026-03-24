import { describe, expect, it } from 'vitest';

import { shouldShowSidebarUpgrade } from '@/components/layout/sidebar';

describe('sidebar upgrade visibility', () => {
  it('shows upgrade only for student accounts on freemium or premium', () => {
    expect(shouldShowSidebarUpgrade('eleve', 'FREEMIUM')).toBe(true);
    expect(shouldShowSidebarUpgrade('eleve', 'PREMIUM')).toBe(true);
    expect(shouldShowSidebarUpgrade('eleve', 'MASTERIUM')).toBe(false);
  });

  it('hides upgrade for admin even if a freemium subscription exists', () => {
    expect(shouldShowSidebarUpgrade('admin', 'FREEMIUM')).toBe(false);
    expect(shouldShowSidebarUpgrade('admin', 'PREMIUM')).toBe(false);
  });
});
