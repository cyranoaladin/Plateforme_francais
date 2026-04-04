-- CreateEnum
CREATE TYPE "ObjetEtude" AS ENUM (
  'POESIE',
  'THEATRE',
  'LITTERATURE_IDEES',
  'ROMAN_RECIT'
);

-- CreateEnum
CREATE TYPE "TypeTexteDescriptif" AS ENUM (
  'EXTRAIT_OEUVRE',
  'EXTRAIT_PARCOURS',
  'LECTURE_CURSIVE',
  'OEUVRE_CHOISIE_ENTRETIEN'
);

-- CreateTable
CREATE TABLE "TexteDescriptif" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "objetEtude" "ObjetEtude" NOT NULL,
  "typeTexte" "TypeTexteDescriptif" NOT NULL,
  "oeuvreAuteur" TEXT NOT NULL,
  "titreExtrait" TEXT NOT NULL,
  "incipit" TEXT,
  "numeroPagesRef" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "contenuTexte" TEXT,
  "fichierPath" TEXT,
  "fichierType" TEXT,
  "parcourAssocie" TEXT,
  "mouvements" JSONB,
  "notesPersonnelles" TEXT,
  "anneeScolaire" TEXT NOT NULL DEFAULT '2025-2026',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TexteDescriptif_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "OralSession" ADD COLUMN "texteDescriptifId" TEXT;

-- CreateIndex
CREATE INDEX "TexteDescriptif_userId_idx" ON "TexteDescriptif"("userId");
CREATE INDEX "TexteDescriptif_userId_objetEtude_idx" ON "TexteDescriptif"("userId", "objetEtude");
CREATE INDEX "TexteDescriptif_userId_typeTexte_idx" ON "TexteDescriptif"("userId", "typeTexte");
CREATE INDEX "TexteDescriptif_userId_anneeScolaire_idx" ON "TexteDescriptif"("userId", "anneeScolaire");
CREATE INDEX "OralSession_texteDescriptifId_idx" ON "OralSession"("texteDescriptifId");

-- AddForeignKey
ALTER TABLE "TexteDescriptif"
ADD CONSTRAINT "TexteDescriptif_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OralSession"
ADD CONSTRAINT "OralSession_texteDescriptifId_fkey"
FOREIGN KEY ("texteDescriptifId") REFERENCES "TexteDescriptif"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve legacy data for application-level archive/migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'TextePrepare'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_legacy_TextePrepare'
  ) THEN
    ALTER TABLE "TextePrepare" RENAME TO "_legacy_TextePrepare";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'DescriptifTexte'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_legacy_DescriptifTexte'
  ) THEN
    ALTER TABLE "DescriptifTexte" RENAME TO "_legacy_DescriptifTexte";
  END IF;
END $$;
