CREATE TYPE "ParentConsentStatus" AS ENUM ('pending', 'granted', 'refused', 'withdrawn');

ALTER TABLE "StudentProfile"
  ALTER COLUMN "anneeScolaire" DROP DEFAULT;

ALTER TABLE "StudentProfile"
  ALTER COLUMN "parentConsentStatus" TYPE "ParentConsentStatus"
  USING COALESCE("parentConsentStatus", 'pending')::"ParentConsentStatus";
