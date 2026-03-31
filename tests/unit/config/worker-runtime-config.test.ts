import { describe, expect, it } from 'vitest';
import packageJson from '../../../package.json';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ecosystem = require('../../../ecosystem.config.cjs');

describe('worker runtime config', () => {
  it('build scripts compile the worker as part of app builds', () => {
    expect(packageJson.scripts['build:worker']).toContain('build-worker.mjs');
    expect(packageJson.scripts.build).toContain('npm run build:worker');
    expect(packageJson.scripts['build:ci']).toContain('npm run build:worker');
  });

  it('pm2 worker points to the compiled dist entry', () => {
    const worker = ecosystem.apps.find((app: { name: string }) => app.name === 'eaf-worker');
    expect(worker).toBeTruthy();
    expect(worker.script).toBe('node');
    expect(worker.args).toContain('dist/worker/src/lib/queue/start-worker.js');
  });
});
