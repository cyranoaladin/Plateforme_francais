-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS "Session_lastSeenAt_idx" ON "Session"("lastSeenAt");
CREATE INDEX IF NOT EXISTS "MemoryEvent_feature_idx" ON "MemoryEvent"("feature");
CREATE INDEX IF NOT EXISTS "StudentProfile_classCode_idx" ON "StudentProfile"("classCode");

-- Add default value for anneeScolaire
ALTER TABLE "StudentProfile" ALTER COLUMN "anneeScolaire" SET DEFAULT '2025-2026';
