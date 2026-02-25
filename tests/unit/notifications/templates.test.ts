import { describe, it, expect } from 'vitest';
import {
  buildWelcomeEmail,
  buildReviewReminder,
  buildInactivityAlert,
  buildDigestNotification,
  shouldSendInactivityAlert,
} from '@/lib/notifications/templates';

const APP_URL = 'https://nexusreussite.academy';

describe('Notification Templates', () => {
  describe('buildWelcomeEmail', () => {
    it('builds a welcome email payload', () => {
      const notif = buildWelcomeEmail('user-1', 'Jean', APP_URL);
      expect(notif.channel).toBe('email');
      expect(notif.recipientId).toBe('user-1');
      expect(notif.subject).toContain('Jean');
      expect(notif.body).toContain('simulation orale');
      expect(notif.actionUrl).toBe(`${APP_URL}/`);
      expect(notif.metadata?.template).toBe('welcome');
    });
  });

  describe('buildReviewReminder', () => {
    it('builds a push reminder for 1 card', () => {
      const notif = buildReviewReminder('user-1', 1, APP_URL);
      expect(notif.channel).toBe('push');
      expect(notif.subject).toContain('1 révision');
      expect(notif.subject).not.toContain('révisions');
      expect(notif.actionUrl).toContain('/revisions');
    });

    it('pluralizes for multiple cards', () => {
      const notif = buildReviewReminder('user-1', 5, APP_URL);
      expect(notif.subject).toContain('5 révisions');
    });
  });

  describe('buildInactivityAlert', () => {
    it('builds inactivity email with correct days', () => {
      const notif = buildInactivityAlert('user-1', 'Marie', 7, APP_URL);
      expect(notif.channel).toBe('email');
      expect(notif.subject).toContain('Marie');
      expect(notif.body).toContain('7 jours');
      expect(notif.metadata?.inactiveDays).toBe('7');
    });
  });

  describe('buildDigestNotification', () => {
    it('builds weekly digest email', () => {
      const notif = buildDigestNotification('parent-1', 'Jean', 'Bilan de la semaine...', APP_URL);
      expect(notif.channel).toBe('email');
      expect(notif.subject).toContain('Jean');
      expect(notif.body).toBe('Bilan de la semaine...');
      expect(notif.actionUrl).toContain('/parent');
    });
  });

  describe('shouldSendInactivityAlert', () => {
    it('triggers at 3, 7, and 14 days', () => {
      expect(shouldSendInactivityAlert(3)).toBe(true);
      expect(shouldSendInactivityAlert(7)).toBe(true);
      expect(shouldSendInactivityAlert(14)).toBe(true);
    });

    it('does not trigger at other days', () => {
      expect(shouldSendInactivityAlert(1)).toBe(false);
      expect(shouldSendInactivityAlert(5)).toBe(false);
      expect(shouldSendInactivityAlert(10)).toBe(false);
      expect(shouldSendInactivityAlert(30)).toBe(false);
    });
  });
});
