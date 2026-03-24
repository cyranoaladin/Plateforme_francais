import { render } from '@react-email/render';
import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

/**
 * Crée un transporteur SMTP via nodemailer.
 * Variables d'environnement requises en production :
 *   SMTP_HOST     — ex. smtp.hostinger.com
 *   SMTP_PORT     — ex. 587 (STARTTLS)
 *   SMTP_USER     — ex. contact@nexusreussite.academy
 *   SMTP_PASS     — mot de passe SMTP
 *   EMAIL_FROM    — adresse d'expédition (défaut: SMTP_USER)
 *
 * Si SMTP_HOST est absent, les emails sont loggés sans être envoyés.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user, pass },
  });
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react?: unknown;
  html?: string;
  replyTo?: string;
}

/**
 * Envoie un email transactionnel avec retry (3 tentatives, backoff exponentiel).
 * Supporte les templates React Email (react) ou HTML brut (html).
 */
export async function sendEmail(
  opts: SendEmailOptions,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const from =
    process.env.EMAIL_FROM ??
    process.env.SMTP_USER ??
    'Nexus Réussite <contact@nexusreussite.academy>';
  const replyTo =
    opts.replyTo ??
    process.env.EMAIL_REPLY_TO ??
    'support@nexusreussite.academy';
  const to = Array.isArray(opts.to) ? opts.to : [opts.to];

  // Render React Email template to HTML if provided
  const html = opts.html
    ?? (opts.react
      ? await render(opts.react as Parameters<typeof render>[0])
      : '<p>Email Nexus Réussite</p>');

  const transporter = getTransporter();

  if (!transporter) {
    logger.warn(
      { to: opts.to, subject: opts.subject },
      'email.smtp_not_configured — email logged but not sent',
    );
    return { success: true, id: 'email-mock-no-smtp' };
  }

  // Retry jusqu'à 3 fois avec backoff exponentiel
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await transporter.sendMail({
        from,
        to: to.join(', '),
        subject: opts.subject,
        html,
        replyTo,
      });

      logger.info(
        {
          emailId: result.messageId,
          to: opts.to,
          subject: opts.subject,
          attempt,
        },
        'Email envoyé avec succès',
      );
      return { success: true, id: result.messageId ?? 'email-sent' };
    } catch (err) {
      const isLastAttempt = attempt === 3;
      logger.warn(
        {
          err,
          to: opts.to,
          subject: opts.subject,
          attempt,
          willRetry: !isLastAttempt,
        },
        `Échec envoi email (tentative ${attempt}/3)`,
      );
      if (isLastAttempt) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        };
      }
      // Backoff : 1s, 2s entre les tentatives
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  return { success: false, error: 'Toutes les tentatives ont échoué' };
}

/** @deprecated Use sendEmail instead */
export const sendTransactionalEmail = async (params: {
  to: string;
  subject: string;
  react?: unknown;
  html?: string;
}): Promise<{ id: string }> => {
  const result = await sendEmail(params);
  return { id: result.id ?? 'email-sent' };
};
