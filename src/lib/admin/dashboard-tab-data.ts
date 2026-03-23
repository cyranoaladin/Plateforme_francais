export type AdminDashboardTab = 'overview' | 'users' | 'codes' | 'payments';

export type AdminDashboardDataLoadTargets = {
  stats: boolean;
  users: boolean;
  codes: boolean;
};

export function getAdminDataLoadTargets(activeTab: AdminDashboardTab): AdminDashboardDataLoadTargets {
  switch (activeTab) {
    case 'overview':
      return { stats: true, users: false, codes: false };
    case 'users':
      return { stats: false, users: true, codes: false };
    case 'codes':
      return { stats: false, users: false, codes: true };
    case 'payments':
      return { stats: false, users: true, codes: false };
    default:
      return { stats: false, users: false, codes: false };
  }
}
