/**
 * DIFF-01 — Profil Card Generator
 * Generates a visual profile card (HTML/SVG) summarizing a student's EAF readiness.
 * Used for: portfolio export, social sharing, parent dashboard.
 */

import { type SkillMap, type SkillAxis } from '@/lib/store/premium-store';
import { estimateGlobalLevel } from '@/lib/memory/scoring';

export type ProfilCardData = {
  displayName: string;
  voie: 'générale' | 'technologique';
  globalLevel: string;
  oralAvg: number | null;
  ecritAvg: number | null;
  axesScores: Record<SkillAxis, number>;
  totalSessions: number;
  topStrengths: string[];
  topWeaknesses: string[];
  badgeCount: number;
  generatedAt: string;
};

/**
 * Extract scores per axis from a SkillMap.
 */
function computeAxesScores(skillMap: SkillMap): Record<SkillAxis, number> {
  const axes: SkillAxis[] = ['ecrit', 'oral', 'langue', 'oeuvres', 'methode'];
  const result = {} as Record<SkillAxis, number>;

  for (const axis of axes) {
    const points = skillMap.axes[axis] ?? [];
    if (points.length === 0) {
      result[axis] = 0;
      continue;
    }
    result[axis] = Math.round(
      (points.reduce((s, p) => s + p.score, 0) / points.length) * 100,
    );
  }

  return result;
}

/**
 * Build a ProfilCardData from raw student data.
 */
export function buildProfilCard(opts: {
  displayName: string;
  voie?: 'générale' | 'technologique';
  skillMap: SkillMap;
  oralAvg?: number | null;
  ecritAvg?: number | null;
  badgeCount?: number;
  totalSessions?: number;
}): ProfilCardData {
  const axesScores = computeAxesScores(opts.skillMap);
  const allPoints = Object.values(opts.skillMap.axes).flat();
  const avgScore = allPoints.length > 0
    ? allPoints.reduce((s, p) => s + p.score, 0) / allPoints.length
    : 0.5;

  const sorted = Object.entries(axesScores).sort((a, b) => b[1] - a[1]);
  const topStrengths = sorted.slice(0, 2).map(([axis]) => axis);
  const topWeaknesses = sorted.slice(-2).map(([axis]) => axis);

  return {
    displayName: opts.displayName,
    voie: opts.voie ?? 'générale',
    globalLevel: estimateGlobalLevel(avgScore),
    oralAvg: opts.oralAvg ?? null,
    ecritAvg: opts.ecritAvg ?? null,
    axesScores,
    totalSessions: opts.totalSessions ?? 0,
    topStrengths,
    topWeaknesses,
    badgeCount: opts.badgeCount ?? 0,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Render a profil card to a simple HTML string (server-side).
 * Can be converted to image via puppeteer/playwright in a CRON job.
 */
export function renderProfilCardHtml(card: ProfilCardData): string {
  const axesBars = (['ecrit', 'oral', 'langue', 'oeuvres', 'methode'] as SkillAxis[])
    .map((axis) => {
      const pct = card.axesScores[axis] ?? 0;
      return `<div class="axis"><span class="label">${axis}</span><div class="bar"><div class="fill" style="width:${pct}%"></div></div><span class="pct">${pct}%</span></div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Profil EAF — ${card.displayName}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 400px; margin: 2rem auto; padding: 1.5rem; border-radius: 16px; background: linear-gradient(135deg, #1e3a5f, #2563eb); color: white; }
  h1 { font-size: 1.4rem; margin: 0 0 .5rem; }
  .meta { font-size: .85rem; opacity: .8; margin-bottom: 1rem; }
  .level { font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; }
  .scores { display: flex; gap: 1rem; margin-bottom: 1rem; }
  .scores .item { text-align: center; }
  .scores .val { font-size: 1.6rem; font-weight: 700; }
  .scores .lbl { font-size: .75rem; opacity: .7; }
  .axis { display: flex; align-items: center; gap: .5rem; margin-bottom: .4rem; }
  .axis .label { width: 70px; font-size: .8rem; text-transform: capitalize; }
  .axis .bar { flex: 1; height: 10px; background: rgba(255,255,255,.2); border-radius: 5px; overflow: hidden; }
  .axis .fill { height: 100%; background: #34d399; border-radius: 5px; transition: width .3s; }
  .axis .pct { width: 35px; font-size: .75rem; text-align: right; }
  .footer { margin-top: 1rem; font-size: .7rem; opacity: .5; text-align: center; }
</style>
</head>
<body>
  <h1>${card.displayName}</h1>
  <div class="meta">Voie ${card.voie} · ${card.totalSessions} sessions · ${card.badgeCount} badges</div>
  <div class="level">Niveau : ${card.globalLevel}</div>
  <div class="scores">
    <div class="item"><div class="val">${card.oralAvg !== null ? card.oralAvg.toFixed(1) : '—'}</div><div class="lbl">Oral /20</div></div>
    <div class="item"><div class="val">${card.ecritAvg !== null ? card.ecritAvg.toFixed(1) : '—'}</div><div class="lbl">Écrit /20</div></div>
  </div>
  ${axesBars}
  <div class="footer">Nexus Réussite EAF · Généré le ${new Date(card.generatedAt).toLocaleDateString('fr-FR')}</div>
</body>
</html>`;
}
