import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('dedicated server deployment guardrails', () => {
  it('n expose aucune trace Vercel dans package.json et le workflow CI', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/ci-cd.yml'), 'utf8');
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    expect(Object.keys(deps).filter((name) => name.startsWith('@vercel/') || name === 'next-on-pages')).toEqual([]);
    expect(pkg.scripts?.['check:no-vercel']).toBe('bash scripts/check-no-vercel.sh');
    expect(pkg.scripts?.['pre-push']).toContain('npm run check:no-vercel');
    expect(workflow).toContain('Guard — Zéro trace Vercel dans le code source');
    expect(workflow).toContain("k.startsWith('@vercel/') || k === 'next-on-pages'");
    expect(workflow).toContain('✅ Aucune trace Vercel détectée');
    expect(workflow).not.toContain('VERCEL_TOKEN');
  });

  it('documente un déploiement exclusivement sur serveur dédié', () => {
    const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');

    expect(readme).toContain('## 🖥️ Déploiement — Serveur Dédié (VPS)');
    expect(readme).toContain('Ce projet est déployé exclusivement sur un serveur dédié Linux');
    expect(readme).toContain('❌ Vercel ni les packages `@vercel/*`');
    expect(readme).toContain('npm run check:no-vercel');
  });

  it('supprime maxDuration des routes cron et fournit le script local de vérification', () => {
    const weekly = readFileSync(resolve(process.cwd(), 'src/app/api/v1/cron/weekly-reports/route.ts'), 'utf8');
    const reminders = readFileSync(resolve(process.cwd(), 'src/app/api/v1/cron/revision-reminders/route.ts'), 'utf8');
    const scriptPath = resolve(process.cwd(), 'scripts/check-no-vercel.sh');
    const script = readFileSync(scriptPath, 'utf8');

    expect(weekly).not.toContain('export const maxDuration');
    expect(reminders).not.toContain('export const maxDuration');
    expect(weekly).toContain('Timeout géré par PM2 kill_timeout');
    expect(reminders).toContain('Timeout géré par PM2 kill_timeout');
    expect(existsSync(scriptPath)).toBe(true);
    expect(script).toContain('Aucune trace Vercel — repo 100% serveur dédié');
    expect(script).toContain('export const maxDuration');
  });
});
