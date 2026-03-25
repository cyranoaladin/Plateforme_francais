/**
 * Regression test: activation code generation and redemption must produce
 * the same hash regardless of dash formatting.
 */
import { describe, expect, it } from 'vitest';
import { normalizeCode, hashCode, isValidCodeFormat } from '@/lib/billing/redeem';

describe('activation code hash consistency', () => {
  it('normalizeCode strips dashes and lowercases', () => {
    expect(normalizeCode('EAF-A1B2-C3D4-E5F6')).toBe('EAFA1B2C3D4E5F6');
    expect(normalizeCode('eaf-a1b2-c3d4-e5f6')).toBe('EAFA1B2C3D4E5F6');
    expect(normalizeCode('EAFA1B2C3D4E5F6')).toBe('EAFA1B2C3D4E5F6');
  });

  it('dashed and undashed codes produce the same hash', () => {
    const dashed = 'EAF-ABCD-EF01-2345';
    const undashed = 'EAFABCDEF012345';
    expect(hashCode(normalizeCode(dashed))).toBe(hashCode(normalizeCode(undashed)));
  });

  it('normalized dashed code passes format validation', () => {
    const normalized = normalizeCode('EAF-A1B2-C3D4-E5F6');
    expect(isValidCodeFormat(normalized)).toBe(true);
    expect(normalized.length).toBeGreaterThanOrEqual(12);
    expect(normalized.length).toBeLessThanOrEqual(20);
  });

  it('generated code format EAF + 12 hex chars normalizes to 15 chars', () => {
    // Simulates what the admin activation-codes route does
    const hex = 'A1B2C3D4E5F6';
    const code = `EAF-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
    const normalized = normalizeCode(code);
    expect(normalized).toBe('EAFA1B2C3D4E5F6');
    expect(normalized.length).toBe(15);
    expect(isValidCodeFormat(normalized)).toBe(true);
  });
});
