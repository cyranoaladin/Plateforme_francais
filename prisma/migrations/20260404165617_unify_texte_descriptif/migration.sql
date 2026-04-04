/*
  Warnings:

  - You are about to drop the `_legacy_DescriptifTexte` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_legacy_TextePrepare` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_legacy_DescriptifTexte" DROP CONSTRAINT "DescriptifTexte_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_legacy_TextePrepare" DROP CONSTRAINT "TextePrepare_userId_fkey";

-- AlterTable
ALTER TABLE "public"."StudentProfile" ADD COLUMN     "lecturesCursives" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "public"."_legacy_DescriptifTexte";

-- DropTable
DROP TABLE "public"."_legacy_TextePrepare";
