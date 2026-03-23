import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('scripts/deploy.sh', () => {
  it('refreshes the active nginx site symlink on every deploy', () => {
    const script = readFileSync(resolve(process.cwd(), 'scripts/deploy.sh'), 'utf8');

    expect(script).toContain('ln -sfn /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN');
  });
});
