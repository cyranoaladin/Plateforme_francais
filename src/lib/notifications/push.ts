import webPush from 'web-push'
import { logger } from '@/lib/logger'

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true

  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:support@nexusreussite.academy'

  if (!publicKey || !privateKey) {
    return false
  }

  webPush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url = '/',
): Promise<void> {
  if (!ensureConfigured()) {
    logger.warn({ userId, title }, 'push.not_configured')
    return
  }

  // No persisted PushSubscription table in current schema snapshot.
  // Keep non-blocking behavior and log intent for later delivery integration.
  logger.info({ userId, title, body, url }, 'push.intent_logged')
}
