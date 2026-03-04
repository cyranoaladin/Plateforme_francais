-- Add gamification columns to StudentProfile (xp, level, xpToNextLevel)
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "xpToNextLevel" INTEGER NOT NULL DEFAULT 100;
