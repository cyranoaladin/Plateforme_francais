-- Fix ActivationCode table to match Prisma schema
-- The table was created before migration 0014 with a different schema

-- Add missing columns
ALTER TABLE "ActivationCode" ADD COLUMN IF NOT EXISTS "codeHash" TEXT;
ALTER TABLE "ActivationCode" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'CREATED';
ALTER TABLE "ActivationCode" ADD COLUMN IF NOT EXISTS "redeemedAt" TIMESTAMP(3);
ALTER TABLE "ActivationCode" ADD COLUMN IF NOT EXISTS "redeemedByUserId" TEXT;
ALTER TABLE "ActivationCode" ADD COLUMN IF NOT EXISTS "batchId" TEXT;
ALTER TABLE "ActivationCode" ADD COLUMN IF NOT EXISTS "orderRef" TEXT;
ALTER TABLE "ActivationCode" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Migrate data: copy code to codeHash where codeHash is null
UPDATE "ActivationCode" SET "codeHash" = "code" WHERE "codeHash" IS NULL AND "code" IS NOT NULL;

-- Set status based on usedCount
UPDATE "ActivationCode" SET "status" = CASE WHEN "usedCount" > 0 THEN 'REDEEMED' ELSE 'CREATED' END WHERE "status" IS NULL OR "status" = 'CREATED';

-- Make codeHash NOT NULL and add unique constraint if not exists
ALTER TABLE "ActivationCode" ALTER COLUMN "codeHash" SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActivationCode_codeHash_key') THEN
    ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_codeHash_key" UNIQUE ("codeHash");
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS "ActivationCode_status_idx" ON "ActivationCode"("status");
CREATE INDEX IF NOT EXISTS "ActivationCode_batchId_idx" ON "ActivationCode"("batchId");

-- Add FK for redeemedByUserId
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActivationCode_redeemedByUserId_fkey') THEN
    ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_redeemedByUserId_fkey" FOREIGN KEY ("redeemedByUserId") REFERENCES "User"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- Cast plan column to TEXT if it's SubscriptionPlan enum
ALTER TABLE "ActivationCode" ALTER COLUMN "plan" TYPE TEXT USING "plan"::TEXT;

-- Make durationDays NOT NULL with default
UPDATE "ActivationCode" SET "durationDays" = 30 WHERE "durationDays" IS NULL;
ALTER TABLE "ActivationCode" ALTER COLUMN "durationDays" SET NOT NULL;

-- Make legacy 'code' column nullable and drop unique constraint to avoid
-- NOT NULL / UNIQUE violations when creating new rows via Prisma (which uses codeHash)
ALTER TABLE "ActivationCode" ALTER COLUMN "code" DROP NOT NULL;
ALTER TABLE "ActivationCode" ALTER COLUMN "code" SET DEFAULT '';
ALTER TABLE "ActivationCode" DROP CONSTRAINT IF EXISTS "ActivationCode_code_key";
DROP INDEX IF EXISTS "ActivationCode_code_idx";
