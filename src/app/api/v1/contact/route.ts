import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendTransactionalEmail } from '@/lib/email/client';
import { logger } from '@/lib/logger';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.enum(['general', 'virement', 'bug', 'autre']),
  message: z.string().min(10).max(2000),
  userId: z.string().optional(),
});

const SUBJECT_LABELS: Record<string, string> = {
  general: 'Contact général',
  virement: 'Confirmation de virement',
  bug: 'Signalement de bug',
  autre: 'Autre demande',
};

const CONTACT_RECIPIENT = process.env.CONTACT_EMAIL ?? 'contact@nexusreussite.academy';

/**
 * POST /api/v1/contact
 * Envoie un message de contact par email.
 * Si SMTP n'est pas configuré, le message est loggé mais pas envoyé.
 */
export async function POST(request: Request) {
  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  try {
    const limit = await checkRateLimit({
      request,
      key: 'contact:form',
      limit: 3,
      windowMs: 60 * 1000,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Trop de messages envoyés. Réessaie dans quelques minutes.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    }

    const parsed = await parseJsonBody(request, contactSchema);
    if (!parsed.success) return parsed.response;

    const { name, email, subject, message, userId } = parsed.data;
    const subjectLabel = SUBJECT_LABELS[subject] ?? subject;

    const smtpConfigured = !!process.env.SMTP_HOST;

    if (smtpConfigured) {
      await sendTransactionalEmail({
        to: CONTACT_RECIPIENT,
        subject: `[Nexus Contact] ${subjectLabel} — ${name}`,
        html: [
          `<h2>${subjectLabel}</h2>`,
          `<p><strong>De :</strong> ${name} (${email})</p>`,
          userId ? `<p><strong>ID utilisateur :</strong> ${userId}</p>` : '',
          `<hr>`,
          `<p>${message.replace(/\n/g, '<br>')}</p>`,
          `<hr>`,
          `<p><em>Envoyé depuis le formulaire de contact Nexus Réussite.</em></p>`,
        ].filter(Boolean).join('\n'),
      });
    }

    logger.info({ name, email, subject, userId, emailSent: smtpConfigured }, 'contact.form.submitted');

    return NextResponse.json({
      ok: true,
      emailSent: smtpConfigured,
      message: smtpConfigured
        ? 'Message envoyé. Nous te répondrons dans les meilleurs délais.'
        : 'Message enregistré. Le système d\'email n\'est pas encore configuré en production — ton message a été loggé et sera traité manuellement.',
    });
  } catch (error) {
    logger.error({ error }, 'contact.form.error');
    return NextResponse.json(
      { error: 'Impossible d\'envoyer le message. Réessaie plus tard.' },
      { status: 500 },
    );
  }
}
