/**
 * PDF Generation Pipeline — Internal document generation.
 *
 * Uses @react-pdf/renderer (already in dependencies) for server-side PDF generation.
 * Fallback: raw HTML string generation for lightweight documents.
 *
 * All generated documents are stored via DocumentDeposit in Prisma.
 *
 * @module pdf/generator
 */

import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export enum PDFTemplate {
  BILAN_ORAL = 'bilan-oral',
  RAPPORT_ECRIT = 'rapport-ecrit',
  CARNET_REVISION = 'carnet-revision',
  RAPPORT_ONBOARDING = 'rapport-onboarding',
  FICHE_OEUVRE = 'fiche-oeuvre',
  FICHE_METHODE = 'fiche-methode',
  RESUME_SESSION = 'resume-session',
}

export interface GeneratePDFOptions {
  template: PDFTemplate;
  data: Record<string, unknown>;
  userId: string;
  filename: string;
}

export interface GeneratedDocument {
  url: string;
  key: string;
  html: string;
}

const UPLOADS_DIR = path.resolve(process.cwd(), '.data/uploads/documents');

/**
 * Ensure the uploads directory exists.
 */
async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Render an HTML document from template + data.
 * Uses simple string interpolation (production-ready for our use case).
 */
function renderHTML(template: PDFTemplate, data: Record<string, unknown>): string {
  const title = String(data['title'] ?? 'Document EAF');
  const date = String(data['date'] ?? new Date().toLocaleDateString('fr-FR'));
  const studentName = String(data['studentName'] ?? 'Élève');

  const css = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
      .header { border-bottom: 3px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
      .header h1 { font-size: 24px; color: #1e40af; }
      .header .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
      .section { margin-bottom: 24px; }
      .section h2 { font-size: 18px; color: #1e40af; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 12px; }
      .section h3 { font-size: 15px; color: #334155; margin-bottom: 8px; }
      .score-badge { display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 14px; }
      .score-badge.excellent { background: #059669; }
      .score-badge.bon { background: #3b82f6; }
      .score-badge.fragile { background: #f59e0b; }
      .score-badge.insuffisant { background: #ef4444; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; }
      th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
      th { background: #f1f5f9; font-weight: 600; color: #475569; }
      ul { padding-left: 20px; margin: 8px 0; }
      li { margin-bottom: 4px; font-size: 13px; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
      .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
      .conseil { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 12px 0; font-size: 13px; }
      @media print { body { padding: 20px; } }
    </style>
  `;

  const header = `
    <div class="header">
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">Nexus Réussite EAF — ${escapeHtml(studentName)} — ${escapeHtml(date)}</div>
    </div>
  `;

  let body = '';

  switch (template) {
    case PDFTemplate.BILAN_ORAL:
      body = renderBilanOral(data);
      break;
    case PDFTemplate.RAPPORT_ECRIT:
      body = renderRapportEcrit(data);
      break;
    case PDFTemplate.RAPPORT_ONBOARDING:
      body = renderRapportOnboarding(data);
      break;
    case PDFTemplate.FICHE_OEUVRE:
      body = renderFicheOeuvre(data);
      break;
    case PDFTemplate.RESUME_SESSION:
      body = renderResumeSession(data);
      break;
    default:
      body = `<div class="section"><p>${escapeHtml(JSON.stringify(data, null, 2))}</p></div>`;
  }

  const footer = `
    <div class="footer">
      Document généré automatiquement par Nexus Réussite EAF — ${escapeHtml(date)}<br>
      Ce document est personnel et confidentiel.
    </div>
  `;

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>${css}</head><body>${header}${body}${footer}</body></html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBilanOral(data: Record<string, unknown>): string {
  const note = Number(data['note'] ?? 0);
  const maxNote = Number(data['maxNote'] ?? 20);
  const mention = String(data['mention'] ?? '');
  const phases = data['phases'] as Record<string, { note: number; max: number; commentaire: string }> | undefined;
  const bilan = String(data['bilan_global'] ?? '');
  const conseil = String(data['conseil_final'] ?? '');

  const badgeClass = note >= 16 ? 'excellent' : note >= 12 ? 'bon' : note >= 8 ? 'fragile' : 'insuffisant';

  let html = `<div class="section"><h2>Note finale</h2><span class="score-badge ${badgeClass}">${note}/${maxNote} — ${escapeHtml(mention)}</span></div>`;

  if (phases) {
    html += '<div class="section"><h2>Détail par phase</h2><table><tr><th>Phase</th><th>Note</th><th>Commentaire</th></tr>';
    for (const [phase, detail] of Object.entries(phases)) {
      html += `<tr><td><strong>${escapeHtml(phase)}</strong></td><td>${detail.note}/${detail.max}</td><td>${escapeHtml(detail.commentaire)}</td></tr>`;
    }
    html += '</table></div>';
  }

  if (bilan) {
    html += `<div class="section"><h2>Bilan global</h2><p>${escapeHtml(bilan)}</p></div>`;
  }
  if (conseil) {
    html += `<div class="conseil"><strong>Conseil :</strong> ${escapeHtml(conseil)}</div>`;
  }

  return html;
}

function renderRapportEcrit(data: Record<string, unknown>): string {
  const note = Number(data['note'] ?? 0);
  const mention = String(data['mention'] ?? '');
  const bilan = data['bilan'] as { global?: string; points_forts?: string[]; axes_amelioration?: string[] } | undefined;
  const rubriques = data['rubriques'] as Array<{ titre: string; note: number; max: number; appreciation: string }> | undefined;
  const conseil = String(data['conseil_final'] ?? '');

  let html = `<div class="section"><h2>Note : ${note}/20 — ${escapeHtml(mention)}</h2></div>`;

  if (rubriques?.length) {
    html += '<div class="section"><h2>Rubriques</h2><table><tr><th>Critère</th><th>Note</th><th>Appréciation</th></tr>';
    for (const r of rubriques) {
      html += `<tr><td>${escapeHtml(r.titre)}</td><td>${r.note}/${r.max}</td><td>${escapeHtml(r.appreciation)}</td></tr>`;
    }
    html += '</table></div>';
  }

  if (bilan) {
    html += `<div class="section"><h2>Bilan</h2><p>${escapeHtml(bilan.global ?? '')}</p>`;
    if (bilan.points_forts?.length) {
      html += '<h3>Points forts</h3><ul>' + bilan.points_forts.map((p) => `<li>${escapeHtml(p)}</li>`).join('') + '</ul>';
    }
    if (bilan.axes_amelioration?.length) {
      html += '<h3>Axes d\'amélioration</h3><ul>' + bilan.axes_amelioration.map((a) => `<li>${escapeHtml(a)}</li>`).join('') + '</ul>';
    }
    html += '</div>';
  }

  if (conseil) {
    html += `<div class="conseil"><strong>Conseil final :</strong> ${escapeHtml(conseil)}</div>`;
  }

  return html;
}

function renderRapportOnboarding(data: Record<string, unknown>): string {
  const niveau = String(data['niveau'] ?? 'Non évalué');
  const priorites = (data['priorites'] as string[] | undefined) ?? [];
  const weakSkills = (data['weakSkills'] as string[] | undefined) ?? [];
  const planning = String(data['planning'] ?? '');

  let html = `<div class="section"><h2>Niveau initial estimé</h2><span class="score-badge">${escapeHtml(niveau)}</span></div>`;

  if (priorites.length) {
    html += '<div class="section"><h2>Priorités de travail</h2><ol>' + priorites.map((p) => `<li>${escapeHtml(p)}</li>`).join('') + '</ol></div>';
  }

  if (weakSkills.length) {
    html += '<div class="section"><h2>Compétences à renforcer</h2><ul>' + weakSkills.map((s) => `<li>${escapeHtml(s)}</li>`).join('') + '</ul></div>';
  }

  if (planning) {
    html += `<div class="section"><h2>Planning de révision</h2><p>${escapeHtml(planning)}</p></div>`;
  }

  return html;
}

function renderFicheOeuvre(data: Record<string, unknown>): string {
  const auteur = String(data['auteur'] ?? '');
  const parcours = String(data['parcours'] ?? '');
  const contexte = String(data['contexte'] ?? '');
  const resume = String(data['resume'] ?? '');
  const themes = (data['themes'] as string[] | undefined) ?? [];
  const citations = (data['citations'] as Array<{ citation: string; procede: string; effet: string }> | undefined) ?? [];

  let html = '';
  if (auteur) html += `<div class="section"><h2>Auteur</h2><p>${escapeHtml(auteur)}</p></div>`;
  if (parcours) html += `<div class="section"><h2>Parcours associé</h2><p>${escapeHtml(parcours)}</p></div>`;
  if (contexte) html += `<div class="section"><h2>Contexte</h2><p>${escapeHtml(contexte)}</p></div>`;
  if (resume) html += `<div class="section"><h2>Résumé</h2><p>${escapeHtml(resume)}</p></div>`;

  if (themes.length) {
    html += '<div class="section"><h2>Thèmes principaux</h2><ul>' + themes.map((t) => `<li>${escapeHtml(t)}</li>`).join('') + '</ul></div>';
  }

  if (citations.length) {
    html += '<div class="section"><h2>Citations clés</h2><table><tr><th>Citation</th><th>Procédé</th><th>Effet</th></tr>';
    for (const c of citations) {
      html += `<tr><td>« ${escapeHtml(c.citation)} »</td><td>${escapeHtml(c.procede)}</td><td>${escapeHtml(c.effet)}</td></tr>`;
    }
    html += '</table></div>';
  }

  return html;
}

function renderResumeSession(data: Record<string, unknown>): string {
  const type = String(data['sessionType'] ?? 'Session');
  const duree = String(data['duree'] ?? '');
  const points = (data['pointsCles'] as string[] | undefined) ?? [];
  const prochaine = String(data['prochaineEtape'] ?? '');

  let html = `<div class="section"><h2>Type : ${escapeHtml(type)}</h2>`;
  if (duree) html += `<p>Durée : ${escapeHtml(duree)}</p>`;
  html += '</div>';

  if (points.length) {
    html += '<div class="section"><h2>Points clés</h2><ul>' + points.map((p) => `<li>${escapeHtml(p)}</li>`).join('') + '</ul></div>';
  }

  if (prochaine) {
    html += `<div class="conseil"><strong>Prochaine étape :</strong> ${escapeHtml(prochaine)}</div>`;
  }

  return html;
}

/**
 * Generate an HTML document from template + data, store it, and register in DocumentDeposit.
 *
 * @returns The stored document URL, storage key, and HTML content.
 */
export async function generateDocument(options: GeneratePDFOptions): Promise<GeneratedDocument> {
  const html = renderHTML(options.template, options.data);

  const userDir = path.join(UPLOADS_DIR, options.userId);
  await ensureDir(userDir);

  const timestamp = Date.now();
  const htmlFilename = `${timestamp}-${options.filename}.html`;
  const key = `documents/${options.userId}/${htmlFilename}`;
  const absolutePath = path.join(userDir, htmlFilename);

  await fs.writeFile(absolutePath, html, 'utf-8');

  const url = `/api/v1/documents/${encodeURIComponent(key)}`;

  if (await isDatabaseAvailable()) {
    try {
      await prisma.documentDeposit.create({
        data: {
          id: randomUUID(),
          profileId: options.userId,
          filename: options.filename,
          fileType: 'html',
          storageUrl: url,
          storageKey: key,
          depositType: 'GENERATED',
        },
      });
    } catch (error) {
      logger.error({ userId: options.userId, filename: options.filename, error }, 'pdf.generator.deposit_save_error');
    }
  }

  logger.info(
    { template: options.template, userId: options.userId, filename: options.filename },
    'pdf.generator.document_created',
  );

  return { url, key, html };
}

/**
 * Generate a bilan oral PDF/HTML after a completed oral session.
 */
export async function generateBilanOralDocument(
  userId: string,
  sessionResult: Record<string, unknown>,
  studentName?: string,
): Promise<GeneratedDocument> {
  return generateDocument({
    template: PDFTemplate.BILAN_ORAL,
    data: {
      ...sessionResult,
      title: 'Bilan Oral EAF',
      studentName: studentName ?? 'Élève',
      date: new Date().toLocaleDateString('fr-FR'),
    },
    userId,
    filename: `bilan-oral-${Date.now()}`,
  });
}

/**
 * Generate a rapport de correction after copy analysis.
 */
export async function generateRapportEcritDocument(
  userId: string,
  correctionResult: Record<string, unknown>,
  studentName?: string,
): Promise<GeneratedDocument> {
  return generateDocument({
    template: PDFTemplate.RAPPORT_ECRIT,
    data: {
      ...correctionResult,
      title: 'Rapport de Correction EAF',
      studentName: studentName ?? 'Élève',
      date: new Date().toLocaleDateString('fr-FR'),
    },
    userId,
    filename: `rapport-ecrit-${Date.now()}`,
  });
}

/**
 * Generate an onboarding report after the initial diagnostic.
 */
export async function generateOnboardingReport(
  userId: string,
  diagnosticData: Record<string, unknown>,
  studentName?: string,
): Promise<GeneratedDocument> {
  return generateDocument({
    template: PDFTemplate.RAPPORT_ONBOARDING,
    data: {
      ...diagnosticData,
      title: 'Rapport d\'Onboarding — Profil Initial',
      studentName: studentName ?? 'Élève',
      date: new Date().toLocaleDateString('fr-FR'),
    },
    userId,
    filename: `rapport-onboarding-${Date.now()}`,
  });
}
