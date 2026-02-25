/**
 * RGPD Mineurs — Per cahier V2 §Sprint 5.
 *
 * French RGPD requires parental consent for users under 15.
 * This module provides:
 *   - Age verification helpers
 *   - Parental consent status types
 *   - Data deletion cascade helpers
 *   - DPO contact information
 */

export const DPO_EMAIL = 'dpo@nexusreussite.academy';
export const MIN_AGE_AUTONOMOUS = 15;
export const DATA_RETENTION_MONTHS = 36;

export type ConsentStatus = 'pending' | 'granted' | 'refused' | 'withdrawn';

export interface ParentalConsent {
  parentEmail: string;
  consentStatus: ConsentStatus;
  consentDate: string | null;
  minorBirthDate: string;
}

/**
 * Check if a user needs parental consent based on their birth date.
 * French RGPD: consent required for users under 15.
 */
export function needsParentalConsent(birthDate: Date, now: Date = new Date()): boolean {
  const age = getAge(birthDate, now);
  return age < MIN_AGE_AUTONOMOUS;
}

/**
 * Calculate age from birth date.
 */
export function getAge(birthDate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Validate that a birth date is plausible for a student (13-20 range).
 */
export function isPlausibleStudentAge(birthDate: Date, now: Date = new Date()): boolean {
  const age = getAge(birthDate, now);
  return age >= 13 && age <= 20;
}

/**
 * List of personal data categories subject to RGPD deletion cascade.
 * Per cahier V2 §5.11: effacement cascade on account deletion.
 */
export const DELETION_CASCADE_TABLES = [
  'OralSession',
  'OralPhaseScore',
  'OralTranscript',
  'OralBilan',
  'Copie',
  'Badge',
  'UsageCounter',
  'LlmCostLog',
  'ComplianceLog',
  'Subscription',
  'PaymentTransaction',
  'PushSubscription',
  'ChatMessage',
] as const;

/**
 * Build a structured RGPD data export payload for a user.
 * Returned as JSON for portability (Article 20).
 */
export function buildRgpdExportMetadata(userId: string): {
  userId: string;
  exportDate: string;
  tables: readonly string[];
  dpoContact: string;
  retentionMonths: number;
} {
  return {
    userId,
    exportDate: new Date().toISOString(),
    tables: DELETION_CASCADE_TABLES,
    dpoContact: DPO_EMAIL,
    retentionMonths: DATA_RETENTION_MONTHS,
  };
}

/**
 * CGU acceptance record type.
 */
export interface CguAcceptance {
  version: string;
  acceptedAt: string;
  ipHash: string;
}

/**
 * Current CGU version. Increment on each update.
 */
export const CGU_VERSION = '2025.1';
