import { sendEmail } from './client';
import WelcomeEmail from '../../../emails/WelcomeEmail';
import ParentNotificationEmail from '../../../emails/ParentNotificationEmail';
import TeacherNotificationEmail from '../../../emails/TeacherNotificationEmail';
import SubscriptionEmail from '../../../emails/SubscriptionEmail';
import EmailVerificationEmail from '../../../emails/EmailVerificationEmail';
import PasswordResetEmail from '../../../emails/PasswordResetEmail';
import PasswordChangedEmail from '../../../emails/PasswordChangedEmail';
import React from 'react';
import { formatPlanLabel } from '@/lib/billing/plan-catalog';
import { getPublicOfferFromAnyPlan } from '@/lib/billing/public-offers';

const APP_URL =
  process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://eaf.nexusreussite.academy';

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
  plan: string;
  transactionId: string;
  startDate: Date;
  nextBillingDate: Date;
}) {
  const offer = getPublicOfferFromAnyPlan(data.plan);
  const fmt = (d: Date) =>
    d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return sendEmail({
    to: data.user.email,
    subject: `Ton plan ${offer.title} est actif — Nexus Réussite`,
    react: React.createElement(SubscriptionEmail, {
      firstName: data.user.firstName,
      email: data.user.email,
      planName: offer.title ?? formatPlanLabel(data.plan),
      planPrice: offer.period ? `${offer.priceTnd} ${offer.period}` : offer.priceTnd,
      startDate: fmt(data.startDate),
      nextBillingDate: fmt(data.nextBillingDate),
      transactionId: data.transactionId,
      dashboardUrl: `${APP_URL}/dashboard`,
      limits: {
        oraux: offer.summaries.oral,
        corrections: offer.summaries.written,
        echanges: offer.summaries.tutor,
        analyses: offer.summaries.ocr,
      },
    }),
  });
}

// ── Email #5 : Vérification d'adresse email ─────────────────────
export async function sendEmailVerificationEmail(params: {
  firstName: string;
  email: string;
  verifyUrl: string;
  expiresAt: string;
}) {
  return sendEmail({
    to: params.email,
    subject: 'Confirme ton adresse email — Nexus Réussite',
    react: React.createElement(EmailVerificationEmail, {
      firstName: params.firstName,
      email: params.email,
      verifyUrl: params.verifyUrl,
      expiresAt: params.expiresAt,
    }),
  });
}

// ── Email #6 : Réinitialisation de mot de passe ─────────────────
export async function sendPasswordResetEmail(params: {
  firstName: string;
  email: string;
  resetUrl: string;
  expiresAt: string;
}) {
  return sendEmail({
    to: params.email,
    subject: 'Réinitialisation de ton mot de passe — Nexus Réussite',
    react: React.createElement(PasswordResetEmail, {
      firstName: params.firstName,
      email: params.email,
      resetUrl: params.resetUrl,
      expiresAt: params.expiresAt,
    }),
  });
}

// ── Email #7 : Confirmation de changement de mot de passe ───────
export async function sendPasswordChangedEmail(params: {
  firstName: string;
  email: string;
  changedAt: string;
  loginUrl: string;
}) {
  return sendEmail({
    to: params.email,
    subject: 'Ton mot de passe a été modifié — Nexus Réussite',
    react: React.createElement(PasswordChangedEmail, {
      firstName: params.firstName,
      email: params.email,
      changedAt: params.changedAt,
      loginUrl: params.loginUrl,
    }),
  });
}
