CREATE TYPE "ParentConsentStatus" AS ENUM ('pending', 'granted', 'refused', 'withdrawn');

ALTER TABLE "StudentProfile"
  ALTER COLUMN "anneeScolaire" DROP DEFAULT;

-- Drop the TEXT default before changing to enum type (PostgreSQL cannot auto-cast)
ALTER TABLE "StudentProfile"
  ALTER COLUMN "parentConsentStatus" DROP DEFAULT;

ALTER TABLE "StudentProfile"
  ALTER COLUMN "parentConsentStatus" TYPE "ParentConsentStatus"
  USING COALESCE("parentConsentStatus", 'pending')::"ParentConsentStatus";

-- Re-add default as enum value
ALTER TABLE "StudentProfile"
  ALTER COLUMN "parentConsentStatus" SET DEFAULT 'pending'::"ParentConsentStatus";
