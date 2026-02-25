import { render } from '@react-email/render'
import { Resend } from 'resend'
import { logger } from '@/lib/logger'

export async function sendTransactionalEmail(params: {
  to: string
  subject: string
  react?: unknown
  html?: string
}): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'nexus@eaf.nexusreussite.academy'

  const html = params.html
    ?? (params.react
      ? await render(params.react as Parameters<typeof render>[0])
      : '<p>Email Nexus</p>')

  if (!apiKey) {
    logger.warn({ to: params.to, subject: params.subject }, 'email.missing_resend_key')
    return { id: 'email-mock-id' }
  }

  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html,
    replyTo: process.env.EMAIL_REPLY_TO,
  })

  if (result.error) {
    logger.error({ error: result.error, to: params.to }, 'email.send_failed')
    throw new Error('Failed to send transactional email')
  }

  return { id: result.data?.id ?? 'email-unknown-id' }
}
