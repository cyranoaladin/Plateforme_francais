-- Migration: 0014_add_billing_tables
-- Ajoute les tables Subscription, PaymentTransaction, UsageCounter et ActivationCode

-- Table Subscription
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "externalCustomerId" TEXT,
  "externalContractId" TEXT,
  "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "currentPeriodStart" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "trialEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Subscription_userId_key" UNIQUE ("userId"),
  CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Subscription_plan_status_idx" ON "Subscription"("plan", "status");

-- Table UsageCounter
CREATE TABLE IF NOT EXISTS "UsageCounter" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UsageCounter_userId_feature_periodKey_key" UNIQUE ("userId", "feature", "periodKey"),
  CONSTRAINT "UsageCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UsageCounter_periodKey_feature_idx" ON "UsageCounter"("periodKey", "feature");

-- Table PaymentTransaction
CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL DEFAULT 'CLICTOPAY',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "plan" "SubscriptionPlan" NOT NULL,
  "amountMillimes" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TND',
  "orderRef" TEXT NOT NULL,
  "providerRef" TEXT,
  "callbackPayload" JSONB,
  "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PaymentTransaction_orderRef_key" UNIQUE ("orderRef"),
  CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PaymentTransaction_userId_createdAt_idx" ON "PaymentTransaction"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- Table ActivationCode (alignée avec le schéma Prisma existant)
CREATE TABLE IF NOT EXISTS "ActivationCode" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "codeHash" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "redeemedAt" TIMESTAMP(3),
  "redeemedByUserId" TEXT,
  "batchId" TEXT,
  "orderRef" TEXT,
  "notes" TEXT,
  CONSTRAINT "ActivationCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ActivationCode_codeHash_key" UNIQUE ("codeHash"),
  CONSTRAINT "ActivationCode_redeemedByUserId_fkey" FOREIGN KEY ("redeemedByUserId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "ActivationCode_status_idx" ON "ActivationCode"("status");
CREATE INDEX IF NOT EXISTS "ActivationCode_batchId_idx" ON "ActivationCode"("batchId");

-- Créer une subscription FREE par défaut pour les utilisateurs existants
INSERT INTO "Subscription" ("id", "userId", "plan", "status", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  "id",
  'FREE'::"SubscriptionPlan",
  'ACTIVE'::"SubscriptionStatus",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
WHERE NOT EXISTS (
  SELECT 1 FROM "Subscription" WHERE "Subscription"."userId" = "User"."id"
);
