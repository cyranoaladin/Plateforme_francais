import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { sendEmail } from './client';

/**
 * Send parental consent request email (RGPD Article 8).
 * Triggered when a minor (under 15) registers.
 */
export async function sendParentalConsentEmail({
  parentEmail,
  studentEmail,
  studentName,
  consentToken,
}: {
  parentEmail: string;
  studentEmail: string;
  studentName: string;
  consentToken: string;
}) {
  try {
    const consentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://eaf.nexusreussite.academy'}/api/v1/rgpd/consent?token=${consentToken}&action=grant`;
    const refusalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://eaf.nexusreussite.academy'}/api/v1/rgpd/consent?token=${consentToken}&action=refuse`;

    const result = await sendEmail({
      to: parentEmail,
      subject: `Consentement parent requis — Inscription de ${studentName} sur Nexus Réussite`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ffffff; padding: 20px 40px 16px; border-radius: 8px 8px 0 0; text-align: center; border-bottom: 3px solid #E63946;">
            <a href="https://nexusreussite.academy" style="display: inline-block;"><img src="https://eaf.nexusreussite.academy/images/logo_slogan_nexus_email.png" alt="Nexus Réussite — Viser. Atteindre. Dépasser." width="220" style="max-width: 220px; height: auto; display: block; margin: 0 auto;" /></a>
          </div>
          <h1 style="color: #0f172a; font-size: 24px; padding: 24px 40px 0;">Demande de consentement parental</h1>
          
          <p>Bonjour,</p>
          
          <p>Votre enfant <strong>${studentName}</strong> (${studentEmail}) souhaite s'inscrire sur <strong>Nexus Réussite</strong>, une plateforme d'entraînement aux épreuves anticipées de Français du baccalauréat.</p>
          
          <p><strong>Conformément au RGPD (Article 8)</strong>, nous avons besoin de votre consentement explicite pour traiter les données personnelles de votre enfant (âgé de moins de 15 ans).</p>
          
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 24px;">Informations collectées :</h2>
          <ul>
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Niveau scolaire et établissement</li>
            <li>Progression dans les exercices</li>
          </ul>
          
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 24px;">Durée de conservation :</h2>
          <p>Les données sont conservées pendant 36 mois maximum après la dernière activité, puis supprimées automatiquement.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <p style="margin: 0 0 16px 0;"><strong>En cliquant sur "Accorder le consentement", vous confirmez que :</strong></p>
            <ul style="margin: 0;">
              <li>Vous êtes le parent ou tuteur légal de ${studentName}</li>
              <li>Vous autorisez le traitement des données personnelles de votre enfant</li>
              <li>Vous avez été informé de vos droits (accès, rectification, suppression)</li>
            </ul>
          </div>
          
          <div style="display: flex; gap: 12px; margin: 32px 0;">
            <a href="${consentUrl}" style="background: #0f766e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              ✅ Accorder le consentement
            </a>
            <a href="${refusalUrl}" style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              ❌ Refuser
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            Si vous avez des questions, contactez notre DPO : <a href="mailto:dpo@nexusreussite.academy">dpo@nexusreussite.academy</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          
          <p style="color: #64748b; font-size: 12px;">
            Nexus Réussite - EAF Platform<br />
            Email envoyé automatiquement - ne pas répondre
          </p>
        </div>
      `,
    });

    if (!result.success) {
      logger.error({ parentEmail, error: result.error }, 'Failed to send parental consent email');
      return { success: false, error: result.error };
    }

    logger.info({ parentEmail, studentEmail }, 'Parental consent email sent');
    return { success: true };
  } catch (error) {
    logger.error({ parentEmail, error }, 'Exception sending parental consent email');
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Generate a unique consent token for parental consent.
 */
export function generateConsentToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Verify and update parental consent status.
 */
export async function verifyParentalConsent({
  token,
  action,
  ipHash,
}: {
  token: string;
  action: 'grant' | 'refuse' | 'withdraw';
  ipHash?: string;
}): Promise<{ success: boolean; message: string; studentEmail?: string }> {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { parentConsentToken: token },
      include: { user: true },
    });

    if (!profile) {
      return { success: false, message: 'Lien de consentement invalide ou expiré.' };
    }

    if (profile.parentConsentStatus === 'withdrawn' && action !== 'grant') {
      return { success: false, message: 'Le consentement a déjà été retiré.' };
    }

    const newStatus = action === 'grant' ? 'granted' : action === 'refuse' ? 'refused' : 'withdrawn';

    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        parentConsentStatus: newStatus,
        parentConsentDate: new Date(),
        parentConsentIpHash: ipHash ?? null,
      },
    });

    logger.info({
      userId: profile.userId,
      action,
      newStatus,
    }, 'Parental consent updated');

    const messages: Record<string, string> = {
      granted: '✅ Consentement parent accordé avec succès. L\u2019inscription de votre enfant est confirmée.',
      refused: '❌ Consentement parent refusé. Le compte de votre enfant sera désactivé.',
      withdrawn: '🚫 Consentement parent retiré. Le compte sera supprimé sous 30 jours.',
    };

    return {
      success: true,
      message: messages[newStatus],
      studentEmail: profile.user.email,
    };
  } catch (error) {
    logger.error({ token, action, error }, 'Error verifying parental consent');
    return { success: false, message: 'Une erreur est survenue. Veuillez réessayer.' };
  }
}
