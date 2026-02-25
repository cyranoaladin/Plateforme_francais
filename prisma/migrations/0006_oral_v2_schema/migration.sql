-- Migration: 0006_oral_v2_schema (Part 1: enum + DDL only, no data migration)
-- PostgreSQL requires ADD VALUE to be committed before the new value can be used.
-- The data migration (UPDATE old states) is in 0007_oral_v2_data_migration.

-- Step 1: Create OralMode enum
DO $$ BEGIN CREATE TYPE "OralMode" AS ENUM ('SIMULATION', 'FREE_PRACTICE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Step 2: Add new enum values to OralSessionStatus
ALTER TYPE "OralSessionStatus" ADD VALUE IF NOT EXISTS 'PREP_RUNNING';
ALTER TYPE "OralSessionStatus" ADD VALUE IF NOT EXISTS 'PREP_ENDED';
ALTER TYPE "OralSessionStatus" ADD VALUE IF NOT EXISTS 'PASSAGE_RUNNING';
ALTER TYPE "OralSessionStatus" ADD VALUE IF NOT EXISTS 'PASSAGE_DONE';
ALTER TYPE "OralSessionStatus" ADD VALUE IF NOT EXISTS 'FINALIZED';
ALTER TYPE "OralSessionStatus" ADD VALUE IF NOT EXISTS 'ABANDONED';

-- Step 3: Add new columns to OralSession
ALTER TABLE "OralSession" ADD COLUMN IF NOT EXISTS "mode" "OralMode" NOT NULL DEFAULT 'SIMULATION';
ALTER TABLE "OralSession" ADD COLUMN IF NOT EXISTS "anneeScolaire" TEXT NOT NULL DEFAULT '2025-2026';
ALTER TABLE "OralSession" ADD COLUMN IF NOT EXISTS "draw" JSONB;
ALTER TABLE "OralSession" ADD COLUMN IF NOT EXISTS "totalScore" INTEGER;
ALTER TABLE "OralSession" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT;
ALTER TABLE "OralSession" ADD COLUMN IF NOT EXISTS "phaseTimestamps" JSONB;

-- Step 4: Add new columns to OralPhaseScore
ALTER TABLE "OralPhaseScore" ADD COLUMN IF NOT EXISTS "aiScore" DOUBLE PRECISION;
ALTER TABLE "OralPhaseScore" ADD COLUMN IF NOT EXISTS "criteria" JSONB;

-- Step 5: Create OralTranscript model
CREATE TABLE IF NOT EXISTS "OralTranscript" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "byPhase" JSONB,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OralTranscript_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OralTranscript_sessionId_key" ON "OralTranscript"("sessionId");
DO $$ BEGIN
  ALTER TABLE "OralTranscript" ADD CONSTRAINT "OralTranscript_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "OralSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Step 6: Create OralBilan model
CREATE TABLE IF NOT EXISTS "OralBilan" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "note" DOUBLE PRECISION NOT NULL,
    "mention" TEXT NOT NULL,
    "bilanGlobal" TEXT NOT NULL,
    "conseilFinal" TEXT NOT NULL,
    "axesProgres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "planRevision" JSONB,
    "citations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OralBilan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OralBilan_sessionId_key" ON "OralBilan"("sessionId");
DO $$ BEGIN
  ALTER TABLE "OralBilan" ADD CONSTRAINT "OralBilan_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "OralSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Step 7: Create OfficialWork table
CREATE TABLE IF NOT EXISTS "OfficialWork" (
    "id" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "oeuvre" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "editeur" TEXT,
    "parcours" TEXT NOT NULL,
    "objetEtude" TEXT NOT NULL,
    "voie" TEXT NOT NULL DEFAULT 'generale',
    "urlEduscol" TEXT,
    "urlBO" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfficialWork_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OfficialWork_anneeScolaire_oeuvre_key" ON "OfficialWork"("anneeScolaire", "oeuvre");
CREATE INDEX IF NOT EXISTS "OfficialWork_anneeScolaire_idx" ON "OfficialWork"("anneeScolaire");
CREATE INDEX IF NOT EXISTS "OfficialWork_objetEtude_idx" ON "OfficialWork"("objetEtude");

-- Step 8: Index on anneeScolaire for OralSession
CREATE INDEX IF NOT EXISTS "OralSession_anneeScolaire_idx" ON "OralSession"("anneeScolaire");
