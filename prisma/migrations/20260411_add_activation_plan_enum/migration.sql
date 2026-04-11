-- Migration: Add ActivationPlan enum and convert ActivationCode.plan column
--
-- Replaces the unconstrained String column with a proper enum type.
-- Existing data: any value not in (PREMIUM, PRO) is mapped to PRO as safest default.

-- 1. Create the enum type
CREATE TYPE "ActivationPlan" AS ENUM ('PREMIUM', 'PRO');

-- 2. Normalise existing string values before type conversion
--    Map legacy plan names to their canonical equivalents
UPDATE "ActivationCode"
SET "plan" = CASE
  WHEN "plan" IN ('FREE', 'MONTHLY') THEN 'PREMIUM'
  ELSE 'PRO'
END
WHERE "plan" NOT IN ('PREMIUM', 'PRO');

-- 3. Change the column type (USING clause handles the cast)
ALTER TABLE "ActivationCode"
  ALTER COLUMN "plan" TYPE "ActivationPlan"
  USING "plan"::"ActivationPlan";
