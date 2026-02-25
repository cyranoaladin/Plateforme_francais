-- Migration: 0006_oral_v2_schema
-- Expand OralSessionStatus to 7 states, add OralMode, OralTranscript, OralBilan, OfficialWork

-- Step 1: Create new OralMode enum
CREATE TYPE "OralMode" AS ENUM ('SIMULATION', 'FREE_PRACTICE');

-- Step 2: Migrate OralSessionStatus enum values
-- Add new values
ALTER TYPE "OralSessionStatus" ADD VALUE IF NOT EXISTS 'PREP_RUNNING';
ALTER TYPE "OralSessionStatus" ADD VALUE IF NOT EXISTS 'PREP_ENDED';
ALTER TYPE "OralSessionStatus" ADD VALUE IF NOT EXISTS 'PASSAGE_RUNNING';
ALTER TYPE "OralSessionStatus" ADD VALUE IF NOT EXISTS 'PASSAGE_DONE';
ALTER TYPE "OralSessionStatus" ADD VALUE IF NOT EXISTS 'FINALIZED';
ALTER TYPE "OralSessionStatus" ADD VALUE IF NOT EXISTS 'ABANDONED';

-- Step 3: Migrate existing data from old states to new states
UPDATE "OralSession" SET "status" = 'PREP_RUNNING' WHERE "status" = 'PREP';
UPDATE "OralSession" SET "status" = 'PASSAGE_RUNNING' WHERE "status" = 'PASSAGE';
UPDATE "OralSession" SET "status" = 'FINALIZED' WHERE "status" = 'DONE';

-- Step 4: Add new columns to OralSession
ALTER TABLE "OralSession" ADD COLUMN IF NOT EXISTS "mode" "OralMode" NOT NULL DEFAULT 'SIMULATION';
ALTER TABLE "OralSession" ADD COLUMN IF NOT EXISTS "anneeScolaire" TEXT NOT NULL DEFAULT '2025-2026';
ALTER TABLE "OralSession" ADD COLUMN IF NOT EXISTS "draw" JSONB;
ALTER TABLE "OralSession" ADD COLUMN IF NOT EXISTS "totalScore" INTEGER;
ALTER TABLE "OralSession" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT;
ALTER TABLE "OralSession" ADD COLUMN IF NOT EXISTS "phaseTimestamps" JSONB;

-- Step 5: Add new columns to OralPhaseScore
ALTER TABLE "OralPhaseScore" ADD COLUMN IF NOT EXISTS "aiScore" DOUBLE PRECISION;
ALTER TABLE "OralPhaseScore" ADD COLUMN IF NOT EXISTS "criteria" JSONB;

-- Step 6: Create OralTranscript model
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
ALTER TABLE "OralTranscript" ADD CONSTRAINT "OralTranscript_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "OralSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Create OralBilan model
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
ALTER TABLE "OralBilan" ADD CONSTRAINT "OralBilan_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "OralSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Create OfficialWork table
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

-- Step 9: Index on anneeScolaire for OralSession
CREATE INDEX IF NOT EXISTS "OralSession_anneeScolaire_idx" ON "OralSession"("anneeScolaire");
