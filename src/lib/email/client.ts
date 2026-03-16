import { render } from '@react-email/render'
import nodemailer from 'nodemailer'
import { logger } from '@/lib/logger'

/**
 * Crée un transporteur SMTP via nodemailer.
 * Variables d'environnement requises en production :
 *   SMTP_HOST     — ex. smtp.hostinger.com
 *   SMTP_PORT     — ex. 465
 *   SMTP_USER     — ex. contact@nexusreussite.academy
 *   SMTP_PASS     — mot de passe SMTP
 *   EMAIL_FROM    — adresse d'expédition (défaut: SMTP_USER)
 *
 * Si SMTP_HOST est absent, les emails sont loggés sans être envoyés.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '465', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendTransactionalEmail(params: {
  to: string
  subject: string
  react?: unknown
  html?: string
}): Promise<{ id: string }> {
  const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? 'contact@nexusreussite.academy'

  const html = params.html
    ?? (params.react
      ? await render(params.react as Parameters<typeof render>[0])
      : '<p>Email Nexus</p>')

  const transporter = getTransporter()

  if (!transporter) {
    logger.warn({ to: params.to, subject: params.subject }, 'email.smtp_not_configured')
    return { id: 'email-mock-id' }
  }

  try {
    const result = await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html,
      replyTo: process.env.EMAIL_REPLY_TO,
    })

    logger.info({ to: params.to, messageId: result.messageId }, 'email.sent')
    return { id: result.messageId ?? 'email-sent' }
  } catch (error) {
    logger.error({ error, to: params.to, subject: params.subject }, 'email.send_failed')
    throw new Error('Impossible d\'envoyer l\'email transactionnel.')
  }
}
