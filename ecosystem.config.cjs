/**
 * PM2 Ecosystem configuration for Nexus Réussite EAF
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 */
module.exports = {
  apps: [
    {
      name: 'eaf-nextjs',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/opt/eaf_platform',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
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
      cwd: '/opt/eaf_platform/packages/mcp-server',
      env: {
        NODE_ENV: 'production',
        MCP_TRANSPORT: 'http',
        MCP_PORT: 3100,
      },
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
  ],
};
