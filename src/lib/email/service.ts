import { sendEmail } from './client';
import WelcomeEmail from '../../../emails/WelcomeEmail';
import ParentNotificationEmail from '../../../emails/ParentNotificationEmail';
import TeacherNotificationEmail from '../../../emails/TeacherNotificationEmail';
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

// ── Email #2 : Notification parent ───────────────────────────────
export async function sendParentNotificationEmail(params: {
  parentEmail: string;
  studentFirstName: string;
  studentClass?: string;
}) {
  return sendEmail({
    to: params.parentEmail,
    subject: `[Nexus Réussite] Votre enfant ${params.studentFirstName} vient de rejoindre la plateforme EAF`,
    react: React.createElement(ParentNotificationEmail, {
      studentFirstName: params.studentFirstName,
      studentClass: params.studentClass ?? 'Première générale',
      platformUrl: APP_URL,
    }),
  });
}

// ── Email #3 : Notification enseignant ──────────────────────────
export async function sendTeacherNotificationEmail(params: {
  teacherEmail: string;
  studentFirstName: string;
  studentLastName?: string;
  studentClass?: string;
}) {
  const fullName = [params.studentFirstName, params.studentLastName].filter(Boolean).join(' ');
  return sendEmail({
    to: params.teacherEmail,
    subject: `[Nexus Réussite] Votre élève ${fullName} s'est inscrit(e) sur la plateforme EAF`,
    react: React.createElement(TeacherNotificationEmail, {
      studentFirstName: params.studentFirstName,
      studentLastName: params.studentLastName ?? '',
      studentClass: params.studentClass ?? 'Première générale',
      platformUrl: APP_URL,
    }),
  });
}

// ── Email #4 : Confirmation de souscription ─────────────────────
export async function sendSubscriptionConfirmationEmail(data: {
  user: { firstName: string; email: string };
  plan: 'FREE' | 'PREMIUM' | 'PRO';
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
    FREE: {
      name: 'Freemium',
      price: 'Gratuit',
      limits: {
        oraux: '1 / semaine',
        corrections: '2 / mois',
        echanges: '3 / jour',
        analyses: '1 / mois',
      },
    },
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
  };

  const config = planConfig[data.plan] ?? planConfig.PREMIUM;
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
