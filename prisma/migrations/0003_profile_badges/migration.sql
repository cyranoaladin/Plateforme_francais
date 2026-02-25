ALTER TABLE "StudentProfile"
  ADD COLUMN "badges" TEXT[] DEFAULT ARRAY[]::TEXT[];
