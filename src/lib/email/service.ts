import { sendEmail } from './client';
import WelcomeEmail from '../../../emails/WelcomeEmail';
import ParentNotificationEmail from '../../../emails/ParentNotificationEmail';
import TeacherNotificationEmail from '../../../emails/TeacherNotificationEmail';
import SubscriptionEmail from '../../../emails/SubscriptionEmail';
import React from 'react';
import { formatPlanLabel } from '@/lib/billing/plan-catalog';

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
    subject: params.studentFirstName
      ? `[Nexus Réussite] Votre enfant ${params.studentFirstName} vient de rejoindre la plateforme EAF`
      : `[Nexus Réussite] Votre enfant vient de rejoindre la plateforme EAF`,
    react: React.createElement(ParentNotificationEmail, {
      studentFirstName: params.studentFirstName || '',
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
  const fullName = [params.studentFirstName, params.studentLastName].filter(Boolean).join(' ') || 'un(e) élève';
  return sendEmail({
    to: params.teacherEmail,
    subject: `[Nexus Réussite] Votre élève ${fullName} s'est inscrit(e) sur la plateforme EAF`,
    react: React.createElement(TeacherNotificationEmail, {
      studentFirstName: params.studentFirstName || '',
      studentLastName: params.studentLastName ?? '',
      studentClass: params.studentClass ?? 'Première générale',
      platformUrl: APP_URL,
    }),
  });
}

export async function sendLinkedRoleInvitationEmail(params: {
  email: string;
  role: 'parent' | 'enseignant';
  studentDisplayName: string;
  rawToken: string;
}) {
  const resetLink = `${APP_URL}/login?mode=reset&token=${params.rawToken}`;
  const roleLabel = params.role === 'parent' ? 'parent' : 'enseignant';
  const intro = params.role === 'parent'
    ? `Un accès parent vient d’être préparé pour suivre la progression de ${params.studentDisplayName}.`
    : `Un accès enseignant vient d’être préparé pour suivre la progression de ${params.studentDisplayName}.`;

  return sendEmail({
    to: params.email,
    subject: `[Nexus Réussite] Active ton accès ${roleLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #17324D;">
        <h2 style="margin-bottom: 16px;">Nexus Réussite — activation de votre accès ${roleLabel}</h2>
        <p>${intro}</p>
        <p>Pour choisir votre mot de passe et accéder à votre tableau de bord, utilisez ce lien sécurisé :</p>
        <p style="margin: 24px 0;">
          <a href="${resetLink}" style="display:inline-block;background:#0F766E;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;">
            Définir mon mot de passe
          </a>
        </p>
        <p>Ce lien reste valable 72 heures. Ensuite, vous pourrez vous reconnecter directement depuis ${APP_URL}/login.</p>
      </div>
    `,
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

  const config = planConfig[data.plan] ?? { ...planConfig.PREMIUM, name: formatPlanLabel(data.plan) };
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
