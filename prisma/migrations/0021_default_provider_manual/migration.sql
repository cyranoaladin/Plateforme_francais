-- AlterTable: change default PaymentProvider from CLICTOPAY to MANUAL
ALTER TABLE "PaymentTransaction" ALTER COLUMN "provider" SET DEFAULT 'MANUAL';
