import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('CI workflows', () => {
  it('remplace le guard FR baseline par un contrôle ciblé sur les banned-phrases', () => {
    const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/ci-cd.yml'), 'utf8');

    expect(workflow).toContain('name: Contrôle copy FR — zero banned-phrases');
    expect(workflow).toContain("(b.violations || []).filter(v => v.kind === 'banned-phrase')");
    expect(workflow).toContain('chore(ci): auto-update fr-copy-baseline [skip ci]');
    expect(workflow).toContain('FR baseline changed but auto-push disabled (PR context)');
    expect(workflow).not.toContain('name: Check FR copy violations');
  });

  it('n utilise plus de concurrency globale et protège le job de déploiement', () => {
    const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/ci-cd.yml'), 'utf8');

    expect(workflow).not.toMatch(/^concurrency:\n  group:/m);
    expect(workflow).toContain('group: deploy-${{ github.ref }}');
    expect(workflow).toContain('cancel-in-progress: false');
    expect(workflow).toContain('for i in {1..12}; do');
    expect(workflow).toContain('https://eaf.nexusreussite.academy/api/v1/health');
  });

  it('ajoute un workflow de PR avec gate dédiée sur main', () => {
    const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/pr-checks.yml'), 'utf8');

    expect(workflow).toContain('name: PR Checks');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain('npm run typecheck');
    expect(workflow).toContain('npm run lint');
    expect(workflow).toContain('npm run test:unit -- --run');
    expect(workflow).toContain('npm run ci:fr-copy -- --update');
    expect(workflow).toContain('BANNED=$(node -e');
  });
});

describe('contribution process guardrails', () => {
  it('expose les scripts locaux de vérification avant push', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(pkg.scripts?.['check-banned']).toBe('node scripts/check-banned-phrases.mjs');
    expect(pkg.scripts?.['pre-push']).toContain('npm run typecheck');
    expect(pkg.scripts?.['pre-push']).toContain('npm run lint');
    expect(pkg.scripts?.['pre-push']).toContain('npm run test:unit -- --run');
    expect(pkg.scripts?.['pre-push']).toContain('npm run ci:fr-copy -- --update');
    expect(pkg.scripts?.['pre-push']).toContain('npm run check-banned');
  });

  it('documente la protection de main et le passage obligatoire par PR', () => {
    const contributing = readFileSync(resolve(process.cwd(), 'docs/CONTRIBUTING.md'), 'utf8');

    expect(contributing).toContain('Aucun push direct sur `main`');
    expect(contributing).toContain('Require status checks to pass: `pr-gate`');
    expect(contributing).toContain('npm run pre-push');
  });
});
