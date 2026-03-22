-- CreateTable: DescriptifTexte
CREATE TABLE "DescriptifTexte" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid(),
  "studentId"       TEXT NOT NULL,
  "objetEtude"      TEXT NOT NULL,
  "oeuvre"          TEXT NOT NULL,
  "auteur"          TEXT NOT NULL,
  "typeExtrait"     TEXT NOT NULL,
  "titre"           TEXT NOT NULL,
  "premieresLignes" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DescriptifTexte_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DescriptifTexte_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE
);
CREATE INDEX "DescriptifTexte_studentId_objetEtude_idx" ON "DescriptifTexte"("studentId", "objetEtude");
