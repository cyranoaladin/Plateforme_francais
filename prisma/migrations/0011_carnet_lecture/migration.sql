-- CreateTable: CarnetEntry
CREATE TABLE "CarnetEntry" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
  "studentId" TEXT NOT NULL,
  "oeuvre"    TEXT NOT NULL,
  "auteur"    TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "contenu"   TEXT NOT NULL,
  "page"      TEXT,
  "tags"      TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CarnetEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CarnetEntry_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE
);
CREATE INDEX "CarnetEntry_studentId_oeuvre_idx" ON "CarnetEntry"("studentId", "oeuvre");
