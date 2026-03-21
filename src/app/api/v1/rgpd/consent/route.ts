import { NextResponse } from 'next/server';
import { verifyParentalConsent } from '@/lib/email/parental-consent';
import { logger } from '@/lib/logger';

/**
 * GET /api/v1/rgpd/consent?token=xxx&action=grant|refuse|withdraw
 * Endpoint for parents to grant, refuse, or withdraw consent.
 * This is a public endpoint (no auth required) as parents may not have accounts.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const action = searchParams.get('action') as 'grant' | 'refuse' | 'withdraw' | null;

    if (!token || !action) {
      return NextResponse.json(
        { error: 'Paramètres manquants. Token et action requis.' },
        { status: 400 }
      );
    }

    if (!['grant', 'refuse', 'withdraw'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez: grant, refuse, ou withdraw.' },
        { status: 400 }
      );
    }

    // Extract IP hash for audit trail (RGPD compliance)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const ipHash = Buffer.from(clientIp).toString('base64');

    const result = await verifyParentalConsent({
      token,
      action,
      ipHash,
    });

    // Return HTML response for better UX (parents clicking from email)
    if (result.success) {
      const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmation - Nexus Réussite</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              max-width: 480px;
              text-align: center;
            }
            .icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              color: #0f172a;
              font-size: 24px;
              margin: 0 0 16px 0;
            }
            p {
              color: #64748b;
              line-height: 1.6;
              margin: 0 0 24px 0;
            }
            .button {
              display: inline-block;
              background: #0f766e;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
            }
            .footer {
              margin-top: 24px;
              padding-top: 24px;
              border-top: 1px solid #e2e8f0;
              font-size: 12px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">${action === 'grant' ? '✅' : action === 'refuse' ? '❌' : '🚫'}</div>
            <h1>${action === 'grant' ? 'Consentement accordé' : action === 'refuse' ? 'Consentement refusé' : 'Consentement retiré'}</h1>
            <p>${result.message}</p>
            ${action === 'grant' 
              ? '<p style="font-size: 14px;">Votre enfant peut maintenant utiliser la plateforme normalement.</p>'
              : '<p style="font-size: 14px;">Le compte sera désactivé conformément à votre décision.</p>'
            }
            <a href="/" class="button">Retour à l'accueil</a>
            <div class="footer">
              Nexus Réussite - EAF Platform<br>
              Contact DPO: dpo@nexusreussite.academy
            </div>
          </div>
        </body>
        </html>
      `;

      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Error case - return HTML with error message
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erreur - Nexus Réussite</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
          }
          .card {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            max-width: 480px;
            text-align: center;
          }
          .icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #dc2626;
            font-size: 24px;
            margin: 0 0 16px 0;
          }
          p {
            color: #64748b;
            line-height: 1.6;
            margin: 0 0 24px 0;
          }
          .button {
            display: inline-block;
            background: #0f766e;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">⚠️</div>
          <h1>Erreur</h1>
          <p>${result.message}</p>
          <a href="/contact" class="button">Contacter le support</a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(errorHtml, {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    logger.error({ error }, 'Unexpected error in consent endpoint');
    return NextResponse.json(
      { error: 'Une erreur inattendue est survenue.' },
      { status: 500 }
    );
  }
}
