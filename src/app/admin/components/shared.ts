import { normalizePlanId } from '@/lib/billing/plan-catalog';

export type AdminUser = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  } | null;
  profile: {
    globalLevel: string | null;
    classLevel: string | null;
    voie: string | null;
    displayName?: string;
    onboardingCompleted?: boolean;
  } | null;
  payments: Array<{
    id: string;
    status: string;
    plan: string;
    amountMillimes: number;
    createdAt: string;
  }>;
  usage: {
    oralSessionsThisMonth: number;
    correctionsThisMonth: number;
    tutorQuestionsToday: number;
    llmTokensToday: number;
  };
  lastLoginAt?: string;
};

export type ActivationCode = {
  id: string;
  codeHash: string;
  plan: string;
  durationDays: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  redeemedAt: string | null;
  plainCode?: string;
};

export type Stats = {
  totalUsers: number;
  activeSubscriptions: number;
  pendingPayments: number;
  totalRevenueTND: number;
  subscriptionsByPlan: Array<{ plan: string; count: number }>;
  newUsersThisMonth: number;
  churnRate: number;
  mrr: number;
  arr: number;
  averageRevenuePerUser: number;
  topFeatures: Array<{ feature: string; usage: number }>;
};

export type Payment = {
  id: string;
  userId: string;
  status: string;
  plan: string;
  amountMillimes: number;
  orderRef: string;
  createdAt: string;
  user: { email: string };
};

export const planColors: Record<'FREE' | 'PREMIUM' | 'PRO', string> = {
  FREE: 'bg-surface-secondary text-body',
  PREMIUM: 'bg-brand-subtle text-brand',
  PRO: 'bg-brand-subtle text-brand',
};

export function getVisiblePlanColor(plan: string) {
  return planColors[normalizePlanId(plan)];
}

export const statusColors: Record<string, string> = {
  ACTIVE: 'bg-success-subtle text-success',
  PENDING: 'bg-reward-subtle text-reward',
  ACCEPTED: 'bg-success-subtle text-success',
  REFUSED: 'bg-accent-subtle text-accent',
  CANCELLED: 'bg-surface-secondary text-body',
  PAUSED: 'bg-reward-subtle text-reward',
  INACTIVE: 'bg-surface-secondary text-body',
  CREATED: 'bg-brand-subtle text-brand',
  DELIVERED: 'bg-success-subtle text-success',
  REDEEMED: 'bg-success-subtle text-success',
  REVOKED: 'bg-accent-subtle text-accent',
  SUSPENDED: 'bg-accent-subtle text-accent',
};

export const statusLabels: Record<string, string> = {
  ACTIVE: 'Actif',
  PENDING: 'En attente',
  ACCEPTED: 'Accepte',
  REFUSED: 'Refuse',
  CANCELLED: 'Annule',
  PAUSED: 'En pause',
  INACTIVE: 'Inactif',
  CREATED: 'Cree',
  DELIVERED: 'Distribue',
  REDEEMED: 'Utilise',
  REVOKED: 'Revoque',
  SUSPENDED: 'Suspendu',
};
