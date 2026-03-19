#!/usr/bin/env tsx

import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import {
  buildPlaywrightDatabaseCandidates,
  buildPlaywrightDockerFallback,
  buildVectorExtensionBootstrapSql,
  type PlaywrightDatabaseCandidate,
  type PlaywrightDockerFallback,
} from '../src/lib/e2e/playwright-db';

const HOST = process.env.E2E_HOST ?? '127.0.0.1';
const PORT = Number(process.env.E2E_PORT ?? '3110');
const RUNTIME_E2E_SCHEMA = process.env.E2E_DB_SCHEMA ?? `playwright_e2e_${process.pid}`;

type RunResult = {
  code: number;
  stdout: string;
  stderr: string;
};

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const values: Record<string, string> = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    values[key] = rawValue.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }

  return values;
}

function loadProjectEnv(): Record<string, string> {
  const cwd = process.cwd();
  return {
    ...parseEnvFile(path.join(cwd, '.env')),
    ...parseEnvFile(path.join(cwd, '.env.local')),
  };
}

function redactDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function buildCommandEnv(candidate: PlaywrightDatabaseCandidate): NodeJS.ProcessEnv {
  return {
    ...process.env,
    DATABASE_URL: candidate.databaseUrl,
    DIRECT_URL: candidate.directUrl,
    E2E_DISABLE_RATE_LIMIT: '1',
    NEXT_TELEMETRY_DISABLED: '1',
  };
}

function getSchemaFromDatabaseUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.searchParams.get('schema');
  } catch {
    return null;
  }
}

function run(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  stdio: 'inherit' | 'pipe' = 'inherit',
  input?: string,
) {
  return new Promise<RunResult>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      stdio,
      shell: false,
    });

    if (stdio === 'inherit') {
      child.on('error', reject);
      child.on('exit', (code) => {
        resolve({ code: code ?? 1, stdout: '', stderr: '' });
      });
      return;
    }

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });
    if (input) {
      child.stdin?.write(input);
      child.stdin?.end();
    }
    child.on('error', reject);
    child.on('exit', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function prepareDatabase(candidates: PlaywrightDatabaseCandidate[]) {
  const failures: string[] = [];

  for (const candidate of candidates) {
    const env = buildCommandEnv(candidate);
    console.log(`[pw_webserver] Trying database candidate ${candidate.label}: ${redactDatabaseUrl(candidate.databaseUrl)}`);
    const schema = getSchemaFromDatabaseUrl(candidate.databaseUrl);
    if (schema) {
      const bootstrapSql = buildVectorExtensionBootstrapSql(schema);
      const bootstrapResult = await run(
        'npx',
        ['prisma', 'db', 'execute', '--stdin', '--schema', 'prisma/schema.prisma'],
        env,
        'pipe',
        bootstrapSql,
      );
      if (bootstrapResult.code !== 0) {
        const bootstrapDetail = (bootstrapResult.stderr || bootstrapResult.stdout).trim().split('\n').slice(-8).join(' | ');
        failures.push(`${candidate.label}: ${bootstrapDetail || 'unable to bootstrap vector extension'}`);
        continue;
      }
    }
    const result = await run('npx', ['prisma', 'db', 'push', '--skip-generate'], env, 'pipe');
    if (result.code === 0) {
      console.log(`[pw_webserver] Using database candidate ${candidate.label}.`);
      return { ok: true as const, candidate, env, failures };
    }

    const detail = (result.stderr || result.stdout).trim().split('\n').slice(-8).join(' | ');
    failures.push(`${candidate.label}: ${detail || `exit ${result.code}`}`);
  }

  return { ok: false as const, failures };
}

async function removeDockerContainer(containerName: string) {
  await run('docker', ['rm', '-f', containerName], process.env, 'pipe');
}

async function waitForDockerDatabase(fallback: PlaywrightDockerFallback) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const ready = await run(
      'docker',
      ['exec', fallback.containerName, 'pg_isready', '-U', fallback.username, '-d', fallback.database],
      process.env,
      'pipe',
    );
    if (ready.code === 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Docker database ${fallback.containerName} did not become ready in time.`);
}

async function startDockerFallback(fallback: PlaywrightDockerFallback) {
  console.log(`[pw_webserver] Starting disposable pgvector database ${fallback.containerName} on ${fallback.host}:${fallback.hostPort}.`);
  await removeDockerContainer(fallback.containerName);

  const runResult = await run(
    'docker',
    [
      'run',
      '--detach',
      '--rm',
      '--pull',
      'never',
      '--name',
      fallback.containerName,
      '--publish',
      `${fallback.host}:${fallback.hostPort}:${fallback.containerPort}`,
      '--env',
      `POSTGRES_USER=${fallback.username}`,
      '--env',
      `POSTGRES_PASSWORD=${fallback.password}`,
      '--env',
      `POSTGRES_DB=${fallback.database}`,
      fallback.image,
    ],
    process.env,
    'pipe',
  );

  if (runResult.code !== 0) {
    throw new Error(`Unable to start docker pgvector fallback: ${(runResult.stderr || runResult.stdout).trim()}`);
  }

  await waitForDockerDatabase(fallback);
}

async function main() {
  const envFileValues = loadProjectEnv();
  const runtimeEnv = {
    ...process.env,
    E2E_DB_SCHEMA: RUNTIME_E2E_SCHEMA,
  };
  const candidates = buildPlaywrightDatabaseCandidates({
    runtimeEnv,
    envFileValues,
  });
  const preparedLocal = await prepareDatabase(candidates);

  let env: NodeJS.ProcessEnv;
  let dockerFallback: PlaywrightDockerFallback | null = null;
  let failures = preparedLocal.failures;
  if (preparedLocal.ok) {
    env = preparedLocal.env;
  } else {
    dockerFallback = buildPlaywrightDockerFallback({
      runtimeEnv,
      envFileValues,
    });
    await startDockerFallback(dockerFallback);
    const preparedDocker = await prepareDatabase([dockerFallback.candidate]);
    if (!preparedDocker.ok) {
      await removeDockerContainer(dockerFallback.containerName);
      throw new Error(`Unable to prepare an E2E database. Attempts: ${failures.concat(preparedDocker.failures).join(' || ')}`);
    }
    failures = failures.concat(preparedDocker.failures);
    env = preparedDocker.env;
  }

  const seedResult = await run('npm', ['run', 'db:seed'], env);
  if (seedResult.code !== 0) {
    throw new Error('db:seed failed during Playwright bootstrap.');
  }

  const buildResult = await run('npm', ['run', 'build'], env);
  if (buildResult.code !== 0) {
    throw new Error('build failed during Playwright bootstrap.');
  }

  const server = spawn('npm', ['run', 'start', '--', '--hostname', HOST, '--port', String(PORT)], {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
    shell: false,
  });

  const shutdown = () => {
    if (!server.killed) {
      server.kill('SIGTERM');
    }
    if (dockerFallback) {
      void removeDockerContainer(dockerFallback.containerName);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  await new Promise((resolve, reject) => {
    server.on('exit', (code) => {
      if (dockerFallback) {
        void removeDockerContainer(dockerFallback.containerName);
      }
      if (code === 0 || code === null) {
        resolve(null);
        return;
      }
      reject(new Error(`Next server exited with code ${code}.`));
    });
    server.on('error', reject);
  });
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[pw_webserver] ${message}`);
  process.exit(1);
});
