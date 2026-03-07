-- Extend enums used by long-term learning memory
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RevisionPhase') THEN
    CREATE TYPE "RevisionPhase" AS ENUM ('J2', 'J7', 'J21');
  END IF;
END $$;

ALTER TYPE "AgentTypeEnum" ADD VALUE IF NOT EXISTS 'TUTEUR_LIBRE';
ALTER TYPE "AgentTypeEnum" ADD VALUE IF NOT EXISTS 'BIBLIOTHECAIRE';
ALTER TYPE "AgentTypeEnum" ADD VALUE IF NOT EXISTS 'COACH_ECRIT';
ALTER TYPE "AgentTypeEnum" ADD VALUE IF NOT EXISTS 'CORRECTEUR';
ALTER TYPE "AgentTypeEnum" ADD VALUE IF NOT EXISTS 'QUIZ_MAITRE';
ALTER TYPE "AgentTypeEnum" ADD VALUE IF NOT EXISTS 'ECRIT_LANGUE';
ALTER TYPE "AgentTypeEnum" ADD VALUE IF NOT EXISTS 'SUPPORT_PRODUIT';

-- Skill map keeps the pedagogical micro-skill key used by app code
ALTER TABLE "SkillMapEntry"
  ADD COLUMN "microSkillKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "SkillMapEntry_profileId_microSkillKey_key"
  ON "SkillMapEntry"("profileId", "microSkillKey");

-- Weak skills become a real revision/error bank
ALTER TABLE "WeakSkillEntry"
  ADD COLUMN "microSkillKey" TEXT,
  ADD COLUMN "sourceInteractionId" TEXT,
  ADD COLUMN "sourceAgent" TEXT;

CREATE TABLE IF NOT EXISTS "WeakSkillRevision" (
  "id" TEXT NOT NULL,
  "weakSkillEntryId" TEXT NOT NULL,
  "phase" "RevisionPhase" NOT NULL,
  "success" BOOLEAN NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeakSkillRevision_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WeakSkillRevision"
  ADD CONSTRAINT "WeakSkillRevision_weakSkillEntryId_fkey"
  FOREIGN KEY ("weakSkillEntryId") REFERENCES "WeakSkillEntry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "WeakSkillRevision_weakSkillEntryId_createdAt_idx"
  ON "WeakSkillRevision"("weakSkillEntryId", "createdAt");

-- Current adaptive plan snapshot
CREATE TABLE IF NOT EXISTS "StudyPlanSnapshot" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "profileId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudyPlanSnapshot_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StudyPlanSnapshot"
  ADD CONSTRAINT "StudyPlanSnapshot_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "StudyPlanSnapshot_profileId_key"
  ON "StudyPlanSnapshot"("profileId");

-- Persisted diagnostics
CREATE TABLE IF NOT EXISTS "DiagnosticSnapshot" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiagnosticSnapshot_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DiagnosticSnapshot"
  ADD CONSTRAINT "DiagnosticSnapshot_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "DiagnosticSnapshot_profileId_completedAt_idx"
  ON "DiagnosticSnapshot"("profileId", "completedAt");

-- Persisted weekly reports
CREATE TABLE IF NOT EXISTS "WeeklyReportSnapshot" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "weekLabel" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeeklyReportSnapshot_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WeeklyReportSnapshot"
  ADD CONSTRAINT "WeeklyReportSnapshot_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "WeeklyReportSnapshot_profileId_generatedAt_idx"
  ON "WeeklyReportSnapshot"("profileId", "generatedAt");

ALTER TABLE "AgentInteraction"
  ALTER COLUMN "feedbackScore" TYPE DOUBLE PRECISION
  USING CASE
    WHEN "feedbackScore" IS NULL THEN NULL
    ELSE "feedbackScore"::DOUBLE PRECISION
  END;
