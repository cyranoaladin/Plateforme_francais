import { describe, expect, it } from 'vitest';

describe('admin dashboard tab data requirements', () => {
  it('loads the user list for the manual payments tab', async () => {
    const mod = await import('@/lib/admin/dashboard-tab-data');

    expect(mod.getAdminDataLoadTargets('payments')).toEqual({
      stats: false,
      users: true,
      codes: false,
      sessions: false,
      activity: false,
      audit: false,
    });
  });
});
