#!/usr/bin/env node
/**
 * Playwright webServer for Tunisia golden tests.
 * Starts:
 *  - docker compose up -d (Postgres)
 *  - waits for pg_isready
 *  - runs prisma migrate deploy
 *  - runs npm run build
 *  - starts Next server (next start) on PORT 3000
 * Cleans up:
 *  - on SIGTERM/SIGINT: kills Next server and docker compose down
 *
 * Assumptions (override with env vars if needed):
 *  - docker compose service name: eaf_postgres
 *  - DB port mapping: 5433 -> 5432
 *  - DB credentials: postgres/postgres, db name: eaf_db
 */

import { spawn } from 'node:child_process';
import process from 'node:process';

const PORT = Number(process.env.PORT ?? 3000);
const DB_HOST = process.env.DB_HOST ?? '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT ?? 5433);
const DB_USER = process.env.DB_USER ?? 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
const DB_NAME = process.env.DB_NAME ?? 'eaf_db';
const PG_SERVICE = process.env.PG_SERVICE ?? 'eaf_postgres';
const BASE_URL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;

// IMPORTANT: ensure app sees DB url
process.env.DATABASE_URL = process.env.DATABASE_URL ?? `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;

let nextProc = null;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
    p.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function detectDockerComposeCmd() {
  // Try `docker compose` first
  try {
    await run('docker', ['compose', 'version'], { stdio: 'ignore' });
    return ['docker', 'compose'];
  } catch {
    // Fallback to docker-compose
    return ['docker-compose'];
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitPgReady(composeCmd) {
  for (let i = 0; i < 60; i++) {
    try {
      await run('docker', ['exec', PG_SERVICE, 'pg_isready', '-U', DB_USER], { stdio: 'ignore' });
      return;
    } catch {
      await sleep(1000);
    }
  }
  throw new Error('Postgres not ready (pg_isready timeout).');
}

async function waitHealth() {
  for (let i = 0; i < 90; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`, { method: 'GET' });
      if (res.ok) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error('Server health timeout.');
}

async function cleanup(composeCmd) {
  try {
    if (nextProc && !nextProc.killed) {
      nextProc.kill('SIGTERM');
    }
  } catch {}
  try {
    if (composeCmd.length === 2) await run(composeCmd[0], [composeCmd[1], 'down'], { stdio: 'inherit' });
    else await run(composeCmd[0], ['down'], { stdio: 'inherit' });
  } catch {}
}

async function main() {
  const composeCmd = await detectDockerComposeCmd();

  const upArgs = composeCmd.length === 2 ? [composeCmd[1], 'up', '-d'] : ['up', '-d'];
  const downArgs = composeCmd.length === 2 ? [composeCmd[1], 'down'] : ['down'];

  const onSignal = async () => {
    await cleanup(composeCmd);
    process.exit(0);
  };
  process.on('SIGTERM', onSignal);
  process.on('SIGINT', onSignal);

  // DB up
  if (composeCmd.length === 2) await run(composeCmd[0], [composeCmd[1], 'up', '-d']);
  else await run(composeCmd[0], ['up', '-d']);

  await waitPgReady(composeCmd);

  // migrations
  await run('npx', ['prisma', 'migrate', 'deploy']);

  // build
  await run('npm', ['run', 'build']);

  // start Next server (stable, prod mode)
  nextProc = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT) },
  });

  await waitHealth();

  // Keep process alive as required by Playwright webServer
  // eslint-disable-next-line no-constant-condition
  while (true) await sleep(10_000);
}

main().catch(async (e) => {
  console.error(`pw_webserver_tunisia failed: ${e?.message ?? e}`);
  process.exit(1);
});
