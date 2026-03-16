/**
 * Notification Templates — Per cahier V2 §Sprint 4 (P1-4).
 *
 * Pure functions that build notification payloads for:
 *   - Welcome email on registration
 *   - Push reminders for scheduled reviews
 *   - Inactivity alerts after N days of no activity
 *   - Weekly digest notification
 */

export type NotificationChannel = 'email' | 'push' | 'in_app';

export interface NotificationPayload {
  channel: NotificationChannel;
  recipientId: string;
  subject: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, string>;
}

/**
 * Welcome email sent on successful registration.
 */
export function buildWelcomeEmail(
  recipientId: string,
  displayName: string,
  appUrl: string,
): NotificationPayload {
  return {
    channel: 'email',
    recipientId,
    subject: `Bienvenue sur Nexus Réussite EAF, ${displayName} !`,
    body: [
      `Bonjour ${displayName},`,
      '',
      'Ton compte Nexus Réussite est prêt. Tu peux dès maintenant :',
      '• Lancer une simulation orale complète (30\' prépa + 20\' passage)',
      '• Soumettre une copie écrite pour correction détaillée',
      '• Réviser avec des quiz adaptatifs et des fiches',
      '',
      'Bonne préparation !',
      'L\'équipe Nexus Réussite',
    ].join('\n'),
    actionUrl: `${appUrl}/`,
    metadata: { template: 'welcome' },
  };
}

/**
 * Push reminder for a scheduled spaced repetition review.
 */
export function buildReviewReminder(
  recipientId: string,
  dueCount: number,
  appUrl: string,
): NotificationPayload {
  const plural = dueCount > 1 ? 's' : '';
  return {
    channel: 'push',
    recipientId,
    subject: `${dueCount} révision${plural} à faire aujourd'hui`,
    body: `Tu as ${dueCount} carte${plural} de révision en attente. Quelques minutes suffisent pour consolider tes acquis !`,
    actionUrl: `${appUrl}/revisions`,
    metadata: { template: 'review_reminder', dueCount: String(dueCount) },
  };
}

/**
 * Inactivity alert after N days without any session.
 */
export function buildInactivityAlert(
  recipientId: string,
  displayName: string,
  inactiveDays: number,
  appUrl: string,
): NotificationPayload {
  return {
    channel: 'email',
    recipientId,
    subject: `${displayName}, tu nous manques ! 📚`,
    body: [
      `Bonjour ${displayName},`,
      '',
      `Cela fait ${inactiveDays} jours que tu n'as pas utilisé la plateforme.`,
      'L\'EAF approche — chaque jour de révision compte !',
      '',
      'Reprends là où tu en étais :',
      '• Une simulation orale rapide en mode libre',
      '• Un quiz de 5 minutes sur les figures de style',
      '• Tes fiches de révision personnalisées',
      '',
      'À très vite !',
      'L\'équipe Nexus Réussite',
    ].join('\n'),
    actionUrl: `${appUrl}/`,
    metadata: { template: 'inactivity', inactiveDays: String(inactiveDays) },
  };
}

/**
 * Weekly digest notification (in-app + email).
 */
export function buildDigestNotification(
  recipientId: string,
  studentName: string,
  weekSummary: string,
  appUrl: string,
): NotificationPayload {
  return {
    channel: 'email',
    recipientId,
    subject: `Bilan hebdomadaire de ${studentName}`,
    body: weekSummary,
    actionUrl: `${appUrl}/parent`,
    metadata: { template: 'weekly_digest' },
  };
}

/**
 * Determine if an inactivity alert should be sent based on days since last activity.
 * Alerts at 3 days, 7 days, and 14 days.
 */
export function shouldSendInactivityAlert(inactiveDays: number): boolean {
  return inactiveDays === 3 || inactiveDays === 7 || inactiveDays === 14;
}
