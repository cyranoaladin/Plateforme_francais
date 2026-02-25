-- Migration: 0007_billing_plans_v2
-- Add PRO and MAX to SubscriptionPlan enum per cahier V2 Sprint 4

ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'PRO';
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'MAX';
