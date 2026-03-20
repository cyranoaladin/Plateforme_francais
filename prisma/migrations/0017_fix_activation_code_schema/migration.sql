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

-- Migrate data: copy code to codeHash where codeHash is null (only if code column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ActivationCode' AND column_name = 'code') THEN
    UPDATE "ActivationCode" SET "codeHash" = "code" WHERE "codeHash" IS NULL AND "code" IS NOT NULL;
  END IF;
END $$;

-- Set status based on usedCount (only if legacy usedCount column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ActivationCode' AND column_name = 'usedCount') THEN
    EXECUTE 'UPDATE "ActivationCode" SET "status" = CASE WHEN "usedCount" > 0 THEN ''REDEEMED'' ELSE ''CREATED'' END WHERE "status" IS NULL OR "status" = ''CREATED''';
  END IF;
END $$;

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

-- Cast plan column to TEXT if it's not already TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ActivationCode' AND column_name = 'plan' AND data_type != 'text'
  ) THEN
    ALTER TABLE "ActivationCode" ALTER COLUMN "plan" TYPE TEXT USING "plan"::TEXT;
  END IF;
END $$;

-- Make durationDays NOT NULL with default
UPDATE "ActivationCode" SET "durationDays" = 30 WHERE "durationDays" IS NULL;
ALTER TABLE "ActivationCode" ALTER COLUMN "durationDays" SET NOT NULL;

-- Handle legacy 'code' column if it exists (drop constraints, make nullable, etc.)
DO $$
BEGIN
  -- Only run these if the 'code' column still exists (legacy tables)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ActivationCode' AND column_name = 'code') THEN
    -- Make legacy 'code' column nullable and drop unique constraint
    ALTER TABLE "ActivationCode" ALTER COLUMN "code" DROP NOT NULL;
    ALTER TABLE "ActivationCode" ALTER COLUMN "code" SET DEFAULT '';
    ALTER TABLE "ActivationCode" DROP CONSTRAINT IF EXISTS "ActivationCode_code_key";
  END IF;
END $$;
DROP INDEX IF EXISTS "ActivationCode_code_idx";
