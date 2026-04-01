import { describe, expect, it } from 'vitest';
import packageJson from '../../../package.json';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ecosystem = require('../../../ecosystem.config.cjs');

describe('worker runtime config', () => {
  it('build scripts compile the worker as part of app builds', () => {
    expect(packageJson.scripts['build:worker']).toContain('build-worker.mjs');
    expect(packageJson.scripts.build).toContain('npm run build:worker');
    expect(packageJson.scripts['build:ci']).toContain('npm run build:worker');
    expect(packageJson.scripts.build).toContain('prisma generate');
    expect(packageJson.scripts['build:ci']).toContain('prisma generate');
  });

  it('declares esbuild as a devDependency (build tool, not runtime)', () => {
    expect(packageJson.devDependencies?.esbuild).toBe('0.27.0');
    expect((packageJson.dependencies as Record<string, string>).esbuild).toBeUndefined();
  });

  it('pm2 worker points to the compiled dist entry', () => {
    const worker = ecosystem.apps.find((app: { name: string }) => app.name === 'eaf-worker');
    expect(worker).toBeTruthy();
    expect(worker.script).toBe('node');
    expect(worker.args).toContain('dist/worker/src/lib/queue/start-worker.js');
  });
});
