-- Migration: add oeuvreNom to TexteDescriptif
-- Allows storing the work title separately from oeuvreAuteur (which mixes title + author)

ALTER TABLE "TexteDescriptif" ADD COLUMN "oeuvreNom" TEXT;

-- Back-fill: derive oeuvreNom from titreExtrait when oeuvreAuteur looks like "Author — Title"
-- (no-op on existing rows without separator; left NULL until user fills it via the form)

CREATE INDEX IF NOT EXISTS "TexteDescriptif_userId_oeuvreNom_idx"
  ON "TexteDescriptif" ("userId", "oeuvreNom");
