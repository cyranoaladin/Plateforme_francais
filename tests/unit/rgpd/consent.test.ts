import { describe, it, expect } from 'vitest';
import {
  needsParentalConsent,
  getAge,
  isPlausibleStudentAge,
  buildRgpdExportMetadata,
  DELETION_CASCADE_TABLES,
  DPO_EMAIL,
  CGU_VERSION,
  MIN_AGE_AUTONOMOUS,
} from '@/lib/rgpd/consent';

describe('RGPD Mineurs', () => {
  const NOW = new Date('2025-06-15T10:00:00Z');

  describe('getAge', () => {
    it('computes age correctly', () => {
      expect(getAge(new Date('2009-06-15'), NOW)).toBe(16);
      expect(getAge(new Date('2009-06-16'), NOW)).toBe(15);
      expect(getAge(new Date('2011-01-01'), NOW)).toBe(14);
    });

    it('returns 0 for future birth dates', () => {
      expect(getAge(new Date('2030-01-01'), NOW)).toBe(0);
    });
  });

  describe('needsParentalConsent', () => {
    it('requires consent for under 15', () => {
      expect(needsParentalConsent(new Date('2012-01-01'), NOW)).toBe(true);
    });

    it('does not require consent for 15+', () => {
      expect(needsParentalConsent(new Date('2010-06-15'), NOW)).toBe(false);
    });

    it('boundary: exactly 15 does not need consent', () => {
      expect(needsParentalConsent(new Date('2010-06-15'), NOW)).toBe(false);
    });

    it('boundary: 14 years 364 days needs consent', () => {
      expect(needsParentalConsent(new Date('2010-06-16'), NOW)).toBe(true);
    });
  });

  describe('isPlausibleStudentAge', () => {
    it('accepts ages 13-20', () => {
      expect(isPlausibleStudentAge(new Date('2009-01-01'), NOW)).toBe(true); // 16
      expect(isPlausibleStudentAge(new Date('2012-06-14'), NOW)).toBe(true); // 13
    });

    it('rejects ages outside 13-20', () => {
      expect(isPlausibleStudentAge(new Date('2015-01-01'), NOW)).toBe(false); // 10
      expect(isPlausibleStudentAge(new Date('2000-01-01'), NOW)).toBe(false); // 25
    });
  });

  describe('buildRgpdExportMetadata', () => {
    it('returns structured metadata', () => {
      const meta = buildRgpdExportMetadata('user-123');
      expect(meta.userId).toBe('user-123');
      expect(meta.tables).toBe(DELETION_CASCADE_TABLES);
      expect(meta.dpoContact).toBe(DPO_EMAIL);
      expect(meta.retentionMonths).toBe(36);
      expect(meta.exportDate).toBeTruthy();
    });
  });

  describe('constants', () => {
    it('DPO email is set', () => {
      expect(DPO_EMAIL).toContain('@');
    });

    it('MIN_AGE_AUTONOMOUS is 15 per French RGPD', () => {
      expect(MIN_AGE_AUTONOMOUS).toBe(15);
    });

    it('CGU_VERSION is set', () => {
      expect(CGU_VERSION).toMatch(/^\d{4}\.\d+$/);
    });

    it('DELETION_CASCADE_TABLES covers all user data', () => {
      expect(DELETION_CASCADE_TABLES.length).toBeGreaterThanOrEqual(10);
      expect(DELETION_CASCADE_TABLES).toContain('OralSession');
      expect(DELETION_CASCADE_TABLES).toContain('Copie');
      expect(DELETION_CASCADE_TABLES).toContain('PaymentTransaction');
    });
  });
});
