const fs = require('fs');
const path = require('path');

// Runtime canonique: PM2 pointe toujours vers le symlink atomique /opt/eaf/current.
const appRoot = '/opt/eaf/current';

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

function loadEnvBundle(baseDir, relativePaths) {
  return relativePaths.reduce((merged, relativePath) => ({
    ...merged,
    ...parseEnvFile(path.join(baseDir, relativePath)),
  }), {});
}

function readOptionalFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    return raw || null;
  } catch {
    return null;
  }
}

function withProductionDefaults(defaults, fileEnv) {
  return {
    ...fileEnv,
    ...defaults,
    NODE_ENV: 'production',
  };
}

const appEnv = loadEnvBundle(appRoot, ['.env', '.env.local', '.env.production', '.release.env']);
const mcpEnv = loadEnvBundle(path.join(appRoot, 'packages', 'mcp-server'), ['.env']);
const sharedMcpApiKey = appEnv.MCP_API_KEY || mcpEnv.MCP_API_KEY;

const releaseGitSha = appEnv.BUILD_GIT_SHA || readOptionalFile(path.join(appRoot, '.git_sha'));
const releaseBuildTime = appEnv.BUILD_TIME || readOptionalFile(path.join(appRoot, '.build_time'));

const webEnv = withProductionDefaults(
  {
    APP_ROOT: appRoot,
    RESSOURCES_ROOT: '/srv/eaf_ressources',
    COPIES_DIR: '/opt/eaf/shared/uploads',
    HEALTH_CHECK_READY: 'true',
    HOSTNAME: '127.0.0.1',
    PORT: '3000',
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
    COPIES_DIR: '/opt/eaf/shared/uploads',
  },
  {
    ...appEnv,
    ...(sharedMcpApiKey ? { MCP_API_KEY: sharedMcpApiKey } : {}),
  },
);

const mcpRuntimeEnv = withProductionDefaults(
  {
    APP_ROOT: appRoot,
    MCP_TRANSPORT: 'http',
    MCP_PORT: '3100',
    PORT: '3100',
    MCP_HTTP_BIND: '127.0.0.1',
  },
  {
    ...appEnv,
    ...mcpEnv,
    ...(sharedMcpApiKey ? { MCP_API_KEY: sharedMcpApiKey } : {}),
  },
);

module.exports = {
  apps: [
    {
      name: 'eaf-nextjs',
      script: path.join(appRoot, '.next/standalone/server.js'),
      cwd: appRoot,
      env: webEnv,
      env_production: webEnv,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '2G',
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s',
      log_file: '/var/log/pm2/eaf-nextjs.log',
      out_file: '/var/log/pm2/eaf-nextjs-out.log',
      error_file: '/var/log/pm2/eaf-nextjs-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
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
      max_memory_restart: '1G',
      restart_delay: 5000,
      log_file: '/var/log/pm2/eaf-worker.log',
      out_file: '/var/log/pm2/eaf-worker-out.log',
      error_file: '/var/log/pm2/eaf-worker-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'eaf-mcp',
      script: 'node',
      args: 'dist/index.js',
      cwd: path.join(appRoot, 'packages', 'mcp-server'),
      env: mcpRuntimeEnv,
      env_production: mcpRuntimeEnv,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      log_file: '/var/log/pm2/eaf-mcp.log',
      out_file: '/var/log/pm2/eaf-mcp-out.log',
      error_file: '/var/log/pm2/eaf-mcp-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
  parseEnvFile,
  loadEnvBundle,
};
