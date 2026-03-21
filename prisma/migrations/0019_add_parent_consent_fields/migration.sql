-- Migration: Add parental consent fields for RGPD compliance
-- Generated: 2026-03-21

-- Add new columns to StudentProfile table
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "parentEmail" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "parentConsentToken" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "parentConsentStatus" TEXT DEFAULT 'pending';
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "parentConsentDate" TIMESTAMP(3);
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "parentConsentIpHash" TEXT;

-- Create unique index for consent token
CREATE UNIQUE INDEX IF NOT EXISTS "StudentProfile_parentConsentToken_key" ON "StudentProfile"("parentConsentToken");

-- Create index for faster lookups by parent email
CREATE INDEX IF NOT EXISTS "StudentProfile_parentEmail_idx" ON "StudentProfile"("parentEmail");

-- Create index for consent status (useful for finding pending consents)
CREATE INDEX IF NOT EXISTS "StudentProfile_parentConsentStatus_idx" ON "StudentProfile"("parentConsentStatus");
