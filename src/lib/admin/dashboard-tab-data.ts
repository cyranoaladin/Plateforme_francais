export type AdminDashboardTab = 'overview' | 'users' | 'codes' | 'payments' | 'sessions' | 'activity' | 'audit';

export type AdminDashboardDataLoadTargets = {
  stats: boolean;
  users: boolean;
  codes: boolean;
  sessions: boolean;
  activity: boolean;
  audit: boolean;
};

export function getAdminDataLoadTargets(activeTab: AdminDashboardTab): AdminDashboardDataLoadTargets {
  const none: AdminDashboardDataLoadTargets = { stats: false, users: false, codes: false, sessions: false, activity: false, audit: false };
  switch (activeTab) {
    case 'overview':
      return { ...none, stats: true };
    case 'users':
      return { ...none, users: true };
    case 'codes':
      return { ...none, codes: true };
    case 'payments':
      return { ...none, users: true };
    case 'sessions':
      return { ...none, sessions: true };
    case 'activity':
      return { ...none, activity: true };
    case 'audit':
      return { ...none, audit: true };
    default:
      return none;
  }
}
