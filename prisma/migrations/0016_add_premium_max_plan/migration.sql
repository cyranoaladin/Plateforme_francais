-- Add PREMIUM and MAX to SubscriptionPlan enum if not already present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PREMIUM' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SubscriptionPlan')) THEN
    ALTER TYPE "SubscriptionPlan" ADD VALUE 'PREMIUM';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'MAX' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'SubscriptionPlan')) THEN
    ALTER TYPE "SubscriptionPlan" ADD VALUE 'MAX';
  END IF;
END $$;
