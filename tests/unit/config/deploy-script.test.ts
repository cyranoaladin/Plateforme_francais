import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('scripts/deploy.sh', () => {
  it('refreshes the active nginx site symlink on every deploy', () => {
    const script = readFileSync(resolve(process.cwd(), 'scripts/deploy.sh'), 'utf8');

    expect(script).toContain('ln -sfn /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN');
  });

  it('reactivates the domain TLS certificate directives when a letsencrypt cert already exists', () => {
    const script = readFileSync(resolve(process.cwd(), 'scripts/deploy.sh'), 'utf8');

    expect(script).toContain('[ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]');
    expect(script).toContain('[ -f /etc/letsencrypt/live/$DOMAIN/privkey.pem ]');
    expect(script).toContain('ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;');
    expect(script).toContain('ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;');
  });

  it('regenerates the Prisma client before the production build', () => {
    const script = readFileSync(resolve(process.cwd(), 'scripts/deploy.sh'), 'utf8');

    expect(script).toContain('npx prisma generate --schema=prisma/schema.prisma');
  });

  it('runs PM2 under the dedicated nexus runtime user', () => {
    const script = readFileSync(resolve(process.cwd(), 'scripts/deploy.sh'), 'utf8');

    expect(script).toContain('APP_RUNTIME_USER="${APP_RUNTIME_USER:-nexus}"');
    expect(script).toContain('sudo -u $APP_RUNTIME_USER env HOME=$APP_RUNTIME_HOME PM2_HOME=$APP_RUNTIME_HOME/.pm2 pm2 startOrRestart ecosystem.config.cjs --env production --update-env');
    expect(script).toContain('sudo -u $APP_RUNTIME_USER env HOME=$APP_RUNTIME_HOME PM2_HOME=$APP_RUNTIME_HOME/.pm2 pm2 save');
  });

  it('verifies the durable resources volume and rechecks the symlink after build', () => {
    const script = readFileSync(resolve(process.cwd(), 'scripts/deploy.sh'), 'utf8');

    expect(script).toContain('REMOTE_RESOURCE_COUNT=$(ssh "$SSH_TARGET" "find -L $RESSOURCES_DIR -type f 2>/dev/null | wc -l")');
    expect(script).toContain('rsync -az --delete ./ressources/ "$SSH_TARGET:$RESSOURCES_DIR/"');
    expect(script).toContain('COUNT=\\$(find -L ./ressources -type f 2>/dev/null | wc -l)');
  });

  it('writes HEALTH_CHECK_READY and configures the uploads backup cron', () => {
    const script = readFileSync(resolve(process.cwd(), 'scripts/deploy.sh'), 'utf8');

    expect(script).toContain("HEALTH_CHECK_READY=true");
    expect(script).toContain('/etc/cron.d/nexus-backup');
    expect(script).toContain('bash scripts/backup-uploads.sh >> /var/log/nexus-backup.log 2>&1');
    expect(script).toContain('fuser -k 3100/tcp 2>/dev/null || true; sleep 2');
  });
});
