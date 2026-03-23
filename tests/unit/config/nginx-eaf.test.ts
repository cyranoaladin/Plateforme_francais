import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('scripts/nginx-eaf.conf', () => {
  it('delegates login throttling to the app instead of serving a dedicated nginx login gate', () => {
    const config = readFileSync(resolve(process.cwd(), 'scripts/nginx-eaf.conf'), 'utf8');

    expect(config).toContain('limit_req_status 429;');
    expect(config).not.toContain('location /api/v1/auth/login');
    expect(config).not.toContain('zone=login');
  });
});
