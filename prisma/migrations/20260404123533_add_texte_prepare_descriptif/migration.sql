/*
  Warnings:

  - The values [PREP,PASSAGE,DONE] on the enum `OralSessionStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[emailVerifyToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `parentConsentStatus` on table `StudentProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."OralSessionStatus_new" AS ENUM ('DRAFT', 'PREP_RUNNING', 'PREP_ENDED', 'PASSAGE_RUNNING', 'PASSAGE_DONE', 'FINALIZED', 'ABANDONED');
ALTER TABLE "public"."OralSession" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."OralSession" ALTER COLUMN "status" TYPE "public"."OralSessionStatus_new" USING ("status"::text::"public"."OralSessionStatus_new");
ALTER TYPE "public"."OralSessionStatus" RENAME TO "OralSessionStatus_old";
ALTER TYPE "public"."OralSessionStatus_new" RENAME TO "OralSessionStatus";
DROP TYPE "public"."OralSessionStatus_old";
ALTER TABLE "public"."OralSession" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentProvider" ADD VALUE 'VIREMENT';
ALTER TYPE "public"."PaymentProvider" ADD VALUE 'FLOUCI';

-- DropForeignKey
ALTER TABLE "public"."ActivationCode" DROP CONSTRAINT "ActivationCode_redeemedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CarnetEntry" DROP CONSTRAINT "CarnetEntry_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ComplianceLog" DROP CONSTRAINT "ComplianceLog_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DescriptifTexte" DROP CONSTRAINT "DescriptifTexte_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PaymentTransaction" DROP CONSTRAINT "PaymentTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PushSubscription" DROP CONSTRAINT "PushSubscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UsageCounter" DROP CONSTRAINT "UsageCounter_userId_fkey";

-- DropIndex
DROP INDEX "public"."Chunk_docId_chunkIndex_unique_idx";

-- DropIndex
DROP INDEX "public"."Chunk_embedding_ivfflat_idx";

-- DropIndex
DROP INDEX "public"."PaymentTransaction_status_idx";

-- DropIndex
DROP INDEX "public"."StudentProfile_parentConsentStatus_idx";

-- DropIndex
DROP INDEX "public"."StudentProfile_parentEmail_idx";

-- AlterTable
ALTER TABLE "public"."ActivationCode" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."CarnetEntry" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Chunk" ADD COLUMN     "level" TEXT,
ADD COLUMN     "oeuvre" TEXT,
ADD COLUMN     "parcours" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "embedding" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."ComplianceLog" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."CopieDeposee" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."DescriptifTexte" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."EpreuveBlanche" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."ErrorBankItem" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Evaluation" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."LlmBudgetAlert" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."LlmCostLog" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."MemoryEvent" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."OralSession" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."PaymentTransaction" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."PushSubscription" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."StudentProfile" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "parentConsentStatus" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."StudyPlanSnapshot" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Subscription" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."UsageCounter" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "emailVerifyExpiry" TIMESTAMP(3),
ADD COLUMN     "emailVerifyToken" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."TextePrepare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oeuvreAuteur" TEXT NOT NULL,
    "titreExtrait" TEXT NOT NULL,
    "incipit" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "anneeScolaire" TEXT NOT NULL DEFAULT '2025-2026',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextePrepare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TextePrepare_userId_idx" ON "public"."TextePrepare"("userId");

-- CreateIndex
CREATE INDEX "Chunk_level_idx" ON "public"."Chunk"("level");

-- CreateIndex
CREATE INDEX "Chunk_oeuvre_idx" ON "public"."Chunk"("oeuvre");

-- CreateIndex
CREATE INDEX "Chunk_oeuvre_parcours_idx" ON "public"."Chunk"("oeuvre", "parcours");

-- CreateIndex
CREATE INDEX "Chunk_sourceType_authorityLevel_idx" ON "public"."Chunk"("sourceType", "authorityLevel");

-- CreateIndex
CREATE INDEX "LlmCostLog_tier_createdAt_idx" ON "public"."LlmCostLog"("tier", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentTransaction_provider_status_idx" ON "public"."PaymentTransaction"("provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerifyToken_key" ON "public"."User"("emailVerifyToken");

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsageCounter" ADD CONSTRAINT "UsageCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivationCode" ADD CONSTRAINT "ActivationCode_redeemedByUserId_fkey" FOREIGN KEY ("redeemedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplianceLog" ADD CONSTRAINT "ComplianceLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DescriptifTexte" ADD CONSTRAINT "DescriptifTexte_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TextePrepare" ADD CONSTRAINT "TextePrepare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarnetEntry" ADD CONSTRAINT "CarnetEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
