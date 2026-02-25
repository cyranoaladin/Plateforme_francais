CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TYPE "UserRole" AS ENUM ('eleve', 'enseignant', 'parent');
CREATE TYPE "CopieStatus" AS ENUM ('pending', 'processing', 'done', 'error');

CREATE TABLE "User" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "passwordSalt" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'eleve',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("token")
);

CREATE TABLE "MemoryEvent" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "path" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemoryEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentProfile" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "classLevel" TEXT NOT NULL,
  "targetScore" TEXT NOT NULL,
  "preferredObjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "weakSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Evaluation" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "maxScore" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL,
  "payload" JSONB,
  "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EpreuveBlanche" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "sujet" TEXT NOT NULL,
  "texte" TEXT NOT NULL,
  "consignes" TEXT NOT NULL,
  "bareme" JSONB NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EpreuveBlanche_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CopieDeposee" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "epreuveId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "status" "CopieStatus" NOT NULL DEFAULT 'pending',
  "ocrText" TEXT,
  "correction" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "correctedAt" TIMESTAMP(3),
  CONSTRAINT "CopieDeposee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OralSession" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "oeuvre" TEXT NOT NULL,
  "extrait" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "transcript" TEXT,
  "score" DOUBLE PRECISION,
  "maxScore" DOUBLE PRECISION,
  "feedback" JSONB,
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OralSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Chunk" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "docId" TEXT NOT NULL,
  "sourceTitle" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" vector(3072) NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "MemoryEvent_userId_createdAt_idx" ON "MemoryEvent"("userId", "createdAt");
CREATE INDEX "MemoryEvent_type_idx" ON "MemoryEvent"("type");
CREATE INDEX "Evaluation_userId_evaluatedAt_idx" ON "Evaluation"("userId", "evaluatedAt");
CREATE INDEX "EpreuveBlanche_userId_generatedAt_idx" ON "EpreuveBlanche"("userId", "generatedAt");
CREATE INDEX "CopieDeposee_userId_createdAt_idx" ON "CopieDeposee"("userId", "createdAt");
CREATE INDEX "CopieDeposee_epreuveId_idx" ON "CopieDeposee"("epreuveId");
CREATE INDEX "OralSession_userId_createdAt_idx" ON "OralSession"("userId", "createdAt");
CREATE INDEX "Chunk_docId_idx" ON "Chunk"("docId");
CREATE INDEX "Chunk_sourceType_idx" ON "Chunk"("sourceType");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryEvent" ADD CONSTRAINT "MemoryEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EpreuveBlanche" ADD CONSTRAINT "EpreuveBlanche_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopieDeposee" ADD CONSTRAINT "CopieDeposee_epreuveId_fkey" FOREIGN KEY ("epreuveId") REFERENCES "EpreuveBlanche"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CopieDeposee" ADD CONSTRAINT "CopieDeposee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OralSession" ADD CONSTRAINT "OralSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
