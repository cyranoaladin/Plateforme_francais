import { describe, expect, it } from 'vitest';

import { getCurrentAnneeScolaire } from '@/lib/date/current-school-year';

describe('getCurrentAnneeScolaire', () => {
  it('returns current-next year from september onward', () => {
    expect(getCurrentAnneeScolaire(new Date('2026-09-01T00:00:00Z'))).toBe('2026-2027');
  });

  it('returns previous-current year before september', () => {
    expect(getCurrentAnneeScolaire(new Date('2026-03-31T00:00:00Z'))).toBe('2025-2026');
  });
});
