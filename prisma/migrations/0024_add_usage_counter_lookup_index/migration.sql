CREATE INDEX IF NOT EXISTS "UsageCounter_userId_feature_periodKey_idx"
ON "UsageCounter"("userId", "feature", "periodKey");
