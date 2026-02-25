-- ────────────────────────────────────────────────────────────
-- Migration 0004 : colonnes RAG + modèles MCP manquants
-- Nexus Réussite EAF — 2026-02-24
-- ────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Colonnes RAG sur Chunk
ALTER TABLE "Chunk"
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "authorityLevel" TEXT NOT NULL DEFAULT 'D',
  ADD COLUMN IF NOT EXISTS "docType" TEXT,
  ADD COLUMN IF NOT EXISTS "legalBasis" TEXT,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sectionPath" TEXT,
  ADD COLUMN IF NOT EXISTS "page" INTEGER,
  ADD COLUMN IF NOT EXISTS "hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Chunk_hash_key" ON "Chunk"("hash");
CREATE INDEX IF NOT EXISTS "Chunk_authorityLevel_idx" ON "Chunk"("authorityLevel");
CREATE INDEX IF NOT EXISTS "Chunk_docType_idx" ON "Chunk"("docType");

-- 2. Colonnes MCP sur StudentProfile
ALTER TABLE "StudentProfile"
  ADD COLUMN IF NOT EXISTS "skillMap" JSONB,
  ADD COLUMN IF NOT EXISTS "streak" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "maxStreak" INTEGER NOT NULL DEFAULT 0;

-- 3. ErrorBankItem
CREATE TABLE IF NOT EXISTS "ErrorBankItem" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "studentId" TEXT NOT NULL,
  "errorType" TEXT NOT NULL,
  "errorContext" TEXT NOT NULL,
  "correction" TEXT NOT NULL DEFAULT '',
  "severity" TEXT NOT NULL DEFAULT 'major',
  "sourceInteractionId" TEXT,
  "nextRevision" TIMESTAMP(3),
  "revisionCount" INTEGER NOT NULL DEFAULT 0,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ErrorBankItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ErrorBankItem_studentId_nextRevision_idx"
  ON "ErrorBankItem"("studentId", "nextRevision");
CREATE INDEX IF NOT EXISTS "ErrorBankItem_studentId_archivedAt_idx"
  ON "ErrorBankItem"("studentId", "archivedAt");

-- 4. ComplianceLog
CREATE TABLE IF NOT EXISTS "ComplianceLog" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "ruleId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "skill" TEXT NOT NULL,
  "studentId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComplianceLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ComplianceLog_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "ComplianceLog_ruleId_createdAt_idx"
  ON "ComplianceLog"("ruleId", "createdAt");
CREATE INDEX IF NOT EXISTS "ComplianceLog_studentId_createdAt_idx"
  ON "ComplianceLog"("studentId", "createdAt");

-- 5. LlmCostLog
CREATE TABLE IF NOT EXISTS "LlmCostLog" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT,
  "skill" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "inputTokens" INTEGER NOT NULL DEFAULT 0,
  "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "costEurCents" INTEGER NOT NULL DEFAULT 0,
  "latencyMs" INTEGER NOT NULL DEFAULT 0,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "errorCode" TEXT,
  "contextSize" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LlmCostLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LlmCostLog_userId_createdAt_idx"
  ON "LlmCostLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "LlmCostLog_provider_createdAt_idx"
  ON "LlmCostLog"("provider", "createdAt");
CREATE INDEX IF NOT EXISTS "LlmCostLog_skill_createdAt_idx"
  ON "LlmCostLog"("skill", "createdAt");

-- 6. LlmBudgetAlert
CREATE TABLE IF NOT EXISTS "LlmBudgetAlert" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "period" TEXT NOT NULL,
  "totalEurCents" INTEGER NOT NULL,
  "threshold" INTEGER NOT NULL,
  "alertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LlmBudgetAlert_pkey" PRIMARY KEY ("id")
);

-- 7. PushSubscription
CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PushSubscription_endpoint_key" UNIQUE ("endpoint"),
  CONSTRAINT "PushSubscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx"
  ON "PushSubscription"("userId");

-- 8. Enum UserRole aligné avec le code
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'enseignant';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'admin';

-- 9. Enums paiement si absents
DO $$ BEGIN
  CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'MONTHLY', 'LIFETIME');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'PAUSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "PaymentProvider" AS ENUM ('CLICTOPAY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED', 'ERROR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
