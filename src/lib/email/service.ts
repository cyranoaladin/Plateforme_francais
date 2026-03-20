import { sendEmail } from './client';
import WelcomeEmail from '../../../emails/WelcomeEmail';
import SubscriptionEmail from '../../../emails/SubscriptionEmail';
import React from 'react';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy';

// ── Email #1 : Bienvenue après inscription ──────────────────────
export async function sendWelcomeEmail(user: {
  firstName: string;
  email: string;
}) {
  return sendEmail({
    to: user.email,
    subject: `Bienvenue sur Nexus Réussite, ${user.firstName}`,
    react: React.createElement(WelcomeEmail, {
      firstName: user.firstName,
      email: user.email,
      dashboardUrl: `${APP_URL}/dashboard`,
      profileSetupUrl: `${APP_URL}/onboarding`,
    }),
  });
}

// ── Email #2 : Confirmation de souscription ─────────────────────
export async function sendSubscriptionConfirmationEmail(data: {
  user: { firstName: string; email: string };
  plan: 'MONTHLY' | 'LIFETIME' | 'PREMIUM' | 'PRO' | 'MAX';
  transactionId: string;
  startDate: Date;
  nextBillingDate: Date;
}) {
  const planConfig: Record<
    string,
    {
      name: string;
      price: string;
      limits: {
        oraux: string;
        corrections: string;
        echanges: string;
        analyses: string;
      };
    }
  > = {
    // Legacy mappings (deprecated but kept for compatibility)
    MONTHLY: {
      name: 'Premium',
      price: '99 TND/mois',
      limits: {
        oraux: '10 / semaine',
        corrections: '20 / mois',
        echanges: '100 / jour',
        analyses: '20 / mois',
      },
    },
    LIFETIME: {
      name: 'Masterium',
      price: '129 TND/mois',
      limits: {
        oraux: 'Illimité',
        corrections: 'Illimité',
        echanges: 'Illimité',
        analyses: '50 / mois',
      },
    },
    // Current mappings (aligned with UI)
    PREMIUM: {
      name: 'Premium',
      price: '99 TND/mois',
      limits: {
        oraux: '10 / semaine',
        corrections: '20 / mois',
        echanges: '100 / jour',
        analyses: '20 / mois',
      },
    },
    PRO: {
      name: 'Masterium',
      price: '129 TND/mois',
      limits: {
        oraux: 'Illimité',
        corrections: 'Illimité',
        echanges: 'Illimité',
        analyses: '50 / mois',
      },
    },
    MAX: {
      name: 'Masterium Lifetime',
      price: '149 TND',
      limits: {
        oraux: 'Illimité',
        corrections: 'Illimité',
        echanges: 'Illimité',
        analyses: '50 / mois',
      },
    },
  };

  const config = planConfig[data.plan] ?? planConfig.MONTHLY;
  const fmt = (d: Date) =>
    d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return sendEmail({
    to: data.user.email,
    subject: `Ton plan ${config.name} est actif — Nexus Réussite`,
    react: React.createElement(SubscriptionEmail, {
      firstName: data.user.firstName,
      email: data.user.email,
      planName: config.name,
      planPrice: config.price,
      startDate: fmt(data.startDate),
      nextBillingDate: fmt(data.nextBillingDate),
      transactionId: data.transactionId,
      dashboardUrl: `${APP_URL}/dashboard`,
      limits: config.limits,
    }),
  });
}
