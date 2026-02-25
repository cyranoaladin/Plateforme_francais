ALTER TABLE "StudentProfile"
  ADD COLUMN "establishment" TEXT,
  ADD COLUMN "eafDate" TIMESTAMP(3),
  ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "selectedOeuvres" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "classCode" TEXT,
  ADD COLUMN "parcoursProgress" TEXT[] DEFAULT ARRAY[]::TEXT[];
