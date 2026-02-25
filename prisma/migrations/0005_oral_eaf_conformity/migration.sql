-- CreateEnum
CREATE TYPE "OralSessionStatus" AS ENUM ('DRAFT', 'PREP', 'PASSAGE', 'DONE');

-- CreateEnum
CREATE TYPE "OralPhase" AS ENUM ('LECTURE', 'EXPLICATION', 'GRAMMAIRE', 'ENTRETIEN');

-- AlterTable: add new columns to OralSession
ALTER TABLE "OralSession" ADD COLUMN "status" "OralSessionStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "OralSession" ADD COLUMN "prepStartedAt" TIMESTAMP(3);
ALTER TABLE "OralSession" ADD COLUMN "prepEndedAt" TIMESTAMP(3);
ALTER TABLE "OralSession" ADD COLUMN "passageStartedAt" TIMESTAMP(3);
ALTER TABLE "OralSession" ADD COLUMN "passageEndedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "OralSession_status_idx" ON "OralSession"("status");

-- CreateTable
CREATE TABLE "OralPhaseScore" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "phase" "OralPhase" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "transcript" TEXT,
    "feedback" TEXT,
    "pointsForts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "axes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "citations" JSONB,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OralPhaseScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OralPhaseScore_sessionId_idx" ON "OralPhaseScore"("sessionId");

-- CreateIndex (unique per session+phase)
CREATE UNIQUE INDEX "OralPhaseScore_sessionId_phase_key" ON "OralPhaseScore"("sessionId", "phase");

-- AddForeignKey
ALTER TABLE "OralPhaseScore" ADD CONSTRAINT "OralPhaseScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OralSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
