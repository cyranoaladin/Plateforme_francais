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
});
