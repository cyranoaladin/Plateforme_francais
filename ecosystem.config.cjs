// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const repoRoot = __dirname;
const appRoot = '/opt/eaf_platform';

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function loadEnvBundle(...relativePaths) {
  return relativePaths.reduce((merged, relativePath) => ({
    ...merged,
    ...parseEnvFile(path.join(repoRoot, relativePath)),
  }), {});
}

const appEnv = loadEnvBundle('.env', '.env.local', '.release.env');
const mcpEnv = loadEnvBundle(path.join('packages', 'mcp-server', '.env'));
const sharedMcpApiKey = appEnv.MCP_API_KEY || mcpEnv.MCP_API_KEY;

function readOptionalFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    return raw || null;
  } catch {
    return null;
  }
}

const releaseGitSha = appEnv.BUILD_GIT_SHA || readOptionalFile(path.join(appRoot, '.git_sha'));
const releaseBuildTime = appEnv.BUILD_TIME || readOptionalFile(path.join(appRoot, '.build_time'));
const slotSuffix = process.env.SLOT ? `-${process.env.SLOT}` : '-blue';

function withProductionDefaults(defaults, fileEnv) {
  return {
    ...fileEnv,
    ...defaults,
    NODE_ENV: 'production',
  };
}

const webEnv = withProductionDefaults(
  {
    APP_ROOT: appRoot,
    RESSOURCES_ROOT: '/srv/eaf_ressources',
    HOSTNAME: '127.0.0.1',
    PORT: 3000,
  },
  {
    ...appEnv,
    ...(sharedMcpApiKey ? { MCP_API_KEY: sharedMcpApiKey } : {}),
    ...(releaseGitSha ? { BUILD_GIT_SHA: releaseGitSha } : {}),
    ...(releaseBuildTime ? { BUILD_TIME: releaseBuildTime } : {}),
  },
);

const workerEnv = withProductionDefaults(
  {
    APP_ROOT: appRoot,
    RESSOURCES_ROOT: '/srv/eaf_ressources',
    ...(sharedMcpApiKey ? { MCP_API_KEY: sharedMcpApiKey } : {}),
  },
  { ...appEnv, ...(sharedMcpApiKey ? { MCP_API_KEY: sharedMcpApiKey } : {}) },
);

const mcpRuntimeEnv = withProductionDefaults(
  {
    MCP_TRANSPORT: 'http',
    MCP_PORT: 3100,
    MCP_HTTP_BIND: '127.0.0.1',
    ...(sharedMcpApiKey ? { MCP_API_KEY: sharedMcpApiKey } : {}),
  },
  { ...mcpEnv, ...(sharedMcpApiKey ? { MCP_API_KEY: sharedMcpApiKey } : {}) },
);

/**
 * PM2 Ecosystem configuration for Nexus Réussite EAF
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 */
module.exports = {
  apps: [
    {
      name: `eaf-nextjs${slotSuffix}`,
      script: '.next/standalone/server.js',
      cwd: appRoot,
      env: webEnv,
      env_production: webEnv,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/eaf-nextjs-error.log',
      out_file: '/var/log/pm2/eaf-nextjs-out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: 'eaf-mcp',
      script: 'node',
      args: 'dist/index.js',
      cwd: `${appRoot}/packages/mcp-server`,
      env: mcpRuntimeEnv,
      env_production: mcpRuntimeEnv,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/eaf-mcp-error.log',
      out_file: '/var/log/pm2/eaf-mcp-out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: 'eaf-worker',
      script: 'node',
      args: 'dist/worker/src/lib/queue/start-worker.js',
      cwd: appRoot,
      env: workerEnv,
      env_production: workerEnv,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/eaf-worker-error.log',
      out_file: '/var/log/pm2/eaf-worker-out.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
  parseEnvFile,
  loadEnvBundle,
};
