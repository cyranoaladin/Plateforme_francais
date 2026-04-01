import { describe, expect, it } from 'vitest';
import { shouldRetryOralRequest } from '@/app/atelier-oral/hooks/useOralApi';

describe('useOralApi helpers', () => {
  it('autorise un retry sur 503 tant que le plafond de tentatives n’est pas atteint', () => {
    expect(shouldRetryOralRequest(503, 0, 2)).toBe(true);
    expect(shouldRetryOralRequest(503, 1, 2)).toBe(false);
  });

  it('refuse le retry pour les autres statuts', () => {
    expect(shouldRetryOralRequest(429, 0, 2)).toBe(false);
    expect(shouldRetryOralRequest(400, 0, 2)).toBe(false);
  });
});
