-- ADDENDUM Memory Store V1: enums, models, OralSession.personaType, StudentProfile extensions

-- New enums
CREATE TYPE "Voie" AS ENUM ('GENERALE', 'TECHNOLOGIQUE');
CREATE TYPE "SkillLevel" AS ENUM ('INSUFFISANT', 'PASSABLE', 'SATISFAISANT', 'EXCELLENT');
CREATE TYPE "ExamPersona" AS ENUM ('BIENVEILLANT', 'NEUTRE', 'HOSTILE', 'RANDOM');
CREATE TYPE "SkillTrend" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING');
CREATE TYPE "EafSkill" AS ENUM (
  'ORAL_LECTURE_FLUIDITE', 'ORAL_LECTURE_EXPRESSIVITE',
  'ORAL_EXPLIC_MOUVEMENT', 'ORAL_EXPLIC_ANALYSE', 'ORAL_EXPLIC_CITATIONS', 'ORAL_EXPLIC_OUVERTURE',
  'ORAL_GRAMM_IDENTIFICATION', 'ORAL_GRAMM_ANALYSE',
  'ORAL_ENTRETIEN_CONNAISSANCE', 'ORAL_ENTRETIEN_REACTIVITE', 'ORAL_ENTRETIEN_CULTURE', 'ORAL_ENTRETIEN_CRITIQUE',
  'ECRIT_COMMENT_PLAN', 'ECRIT_COMMENT_ANALYSE', 'ECRIT_COMMENT_CITATIONS',
  'ECRIT_DISSERT_THESE', 'ECRIT_DISSERT_TRANSITION', 'ECRIT_DISSERT_EXEMPLES',
  'TRANS_LANGUE_GRAMMAIRE', 'TRANS_LANGUE_STYLE', 'TRANS_LANGUE_SYNTAXE',
  'TRANS_TEMPS_GESTION', 'TRANS_CULTURE_GENERALE'
);
CREATE TYPE "WeakSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "WeakStatus" AS ENUM ('ACTIVE', 'IMPROVING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "SummaryType" AS ENUM ('FULL', 'ORAL', 'ECRIT', 'RECENT_SESSIONS', 'WEAK_SKILLS');
CREATE TYPE "DocStatus" AS ENUM ('DOC_PENDING', 'DOC_PROCESSING', 'DOC_DONE', 'DOC_ERROR');
CREATE TYPE "DocType" AS ENUM ('COPIE_ECRIT', 'ENREGISTREMENT_ORAL', 'RESSOURCE', 'AUTRE');
CREATE TYPE "AgentTypeEnum" AS ENUM (
  'TIRAGE_ORAL', 'SHADOW_PREP', 'COACH_LECTURE', 'COACH_EXPLICATION',
  'GRAMMAIRE_CIBLEE', 'ENTRETIEN_OEUVRE', 'BILAN_ORAL', 'DIAGNOSTIC_ECRIT',
  'PASTICHE', 'QUIZ_ADAPTATIF', 'EXAMINATEUR_VIRTUEL'
);

-- Extend StudentProfile with ADDENDUM fields
ALTER TABLE "StudentProfile" ADD COLUMN "voie" "Voie" NOT NULL DEFAULT 'GENERALE';
ALTER TABLE "StudentProfile" ADD COLUMN "anneeScolaire" TEXT NOT NULL DEFAULT '2025-2026';
ALTER TABLE "StudentProfile" ADD COLUMN "targetExamDate" TIMESTAMP(3);
ALTER TABLE "StudentProfile" ADD COLUMN "weeklyGoalMinutes" INTEGER NOT NULL DEFAULT 120;
ALTER TABLE "StudentProfile" ADD COLUMN "prefWorkingHours" JSONB;
ALTER TABLE "StudentProfile" ADD COLUMN "accessibilityNeeds" JSONB;
ALTER TABLE "StudentProfile" ADD COLUMN "personaPreference" "ExamPersona" NOT NULL DEFAULT 'NEUTRE';
ALTER TABLE "StudentProfile" ADD COLUMN "globalLevel" "SkillLevel" NOT NULL DEFAULT 'INSUFFISANT';
ALTER TABLE "StudentProfile" ADD COLUMN "globalLevelUpdatedAt" TIMESTAMP(3);

-- Add personaType to OralSession
ALTER TABLE "OralSession" ADD COLUMN "personaType" "ExamPersona" NOT NULL DEFAULT 'NEUTRE';

-- SkillMapEntry
CREATE TABLE "SkillMapEntry" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "skill" "EafSkill" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "trend" "SkillTrend" NOT NULL DEFAULT 'STABLE',
    "observationCount" INTEGER NOT NULL DEFAULT 0,
    "srNextReview" TIMESTAMP(3),
    "srInterval" INTEGER NOT NULL DEFAULT 1,
    "srEaseFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "srRepetitions" INTEGER NOT NULL DEFAULT 0,
    "lastObservedAt" TIMESTAMP(3),
    CONSTRAINT "SkillMapEntry_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "SkillMapEntry" ADD CONSTRAINT "SkillMapEntry_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "SkillMapEntry_profileId_skill_key" ON "SkillMapEntry"("profileId", "skill");

-- WeakSkillEntry
CREATE TABLE "WeakSkillEntry" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "skill" "EafSkill" NOT NULL,
    "pattern" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "examples" JSONB NOT NULL DEFAULT '[]',
    "embedding" vector(1536),
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "severity" "WeakSeverity" NOT NULL DEFAULT 'LOW',
    "decayedScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" "WeakStatus" NOT NULL DEFAULT 'ACTIVE',
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOccurrence" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "WeakSkillEntry_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "WeakSkillEntry" ADD CONSTRAINT "WeakSkillEntry_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "WeakSkillEntry_profileId_status_idx" ON "WeakSkillEntry"("profileId", "status");
CREATE INDEX "WeakSkillEntry_severity_idx" ON "WeakSkillEntry"("severity");

-- WorkMastery
CREATE TABLE "WorkMastery" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "masteryLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "srNextReview" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "srInterval" INTEGER NOT NULL DEFAULT 1,
    "srEaseFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "srRepetitions" INTEGER NOT NULL DEFAULT 0,
    "strongThemes" JSONB NOT NULL DEFAULT '[]',
    "weakThemes" JSONB NOT NULL DEFAULT '[]',
    "citationsKnown" JSONB NOT NULL DEFAULT '[]',
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "lastSessionAt" TIMESTAMP(3),
    CONSTRAINT "WorkMastery_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "WorkMastery" ADD CONSTRAINT "WorkMastery_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "WorkMastery_profileId_workId_key" ON "WorkMastery"("profileId", "workId");

-- MemorySummary
CREATE TABLE "MemorySummary" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "summaryType" "SummaryType" NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "embedding" vector(1536),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "MemorySummary_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "MemorySummary" ADD CONSTRAINT "MemorySummary_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "MemorySummary_profileId_summaryType_key" ON "MemorySummary"("profileId", "summaryType");

-- DocumentDeposit
CREATE TABLE "DocumentDeposit" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "ocrText" TEXT,
    "analysisResult" JSONB,
    "analysisStatus" "DocStatus" NOT NULL DEFAULT 'DOC_PENDING',
    "linkedSessionId" TEXT,
    "workId" TEXT,
    "depositType" "DocType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    CONSTRAINT "DocumentDeposit_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "DocumentDeposit" ADD CONSTRAINT "DocumentDeposit_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AgentInteraction
CREATE TABLE "AgentInteraction" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "sessionId" TEXT,
    "agentType" "AgentTypeEnum" NOT NULL,
    "inputSummary" TEXT NOT NULL,
    "outputSummary" TEXT NOT NULL,
    "feedbackScore" INTEGER,
    "feedbackLabel" TEXT,
    "tokensUsed" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "ragSourcesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentInteraction_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "AgentInteraction" ADD CONSTRAINT "AgentInteraction_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "AgentInteraction_profileId_createdAt_idx" ON "AgentInteraction"("profileId", "createdAt");
CREATE INDEX "AgentInteraction_agentType_idx" ON "AgentInteraction"("agentType");
