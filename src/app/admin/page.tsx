'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from '@/components/ui/icons';
import { Card } from '@/components/ui';
import { getAdminDataLoadTargets, type AdminDashboardTab } from '@/lib/admin/dashboard-tab-data';
import { type Stats, type Payment, type AdminUser, type ActivationCode } from './components/shared';
import { OverviewTab } from './components/overview-tab';
import { UsersTab } from './components/users-tab';
import { CodesTab } from './components/codes-tab';
import { PaymentsTab } from './components/payments-tab';
import { SessionsTab } from './components/sessions-tab';
import { ActivityTab } from './components/activity-tab';
import { AuditTab } from './components/audit-tab';

type SessionEntry = {
  userId: string;
  email: string;
  role: string;
  displayName: string | null;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
};

type ActivityData = {
  period: { days: number; since: string };
  recentEvents: Array<{
    id: string;
    userId: string;
    email: string;
    type: string;
    feature: string;
    createdAt: string;
  }>;
  featureBreakdown: Array<{ feature: string; count: number }>;
  typeBreakdown: Array<{ type: string; count: number }>;
  llm: {
    bySkill: Array<{
      skill: string;
      calls: number;
      costCents: number;
      inputTokens: number;
      outputTokens: number;
    }>;
    totals: {
      calls: number;
      costCents: number;
      inputTokens: number;
      outputTokens: number;
    };
  };
  dailyActive: Array<{ day: string; count: number }>;
};

type AuditEntry = {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as AdminDashboardTab) || 'overview';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [totalActiveSessions, setTotalActiveSessions] = useState(0);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [activityDays, setActivityDays] = useState(7);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditFilter, setAuditFilter] = useState<string | null>(null);

  const loadData = useCallback(async (overrideDays?: number) => {
    setLoading(true);
    setError(null);

    try {
      const loadTargets = getAdminDataLoadTargets(activeTab);

      if (loadTargets.stats) {
        const res = await fetch('/api/v1/admin/stats');
        if (res.status === 401) { router.push('/admin/login'); return; }
        if (res.status === 403) { router.push('/dashboard'); return; }
        if (!res.ok) throw new Error('Erreur lors du chargement des statistiques');
        const data = await res.json();
        setStats(data.stats);
        setRecentPayments(data.recentPayments);
      }

      if (loadTargets.users) {
        const res = await fetch('/api/v1/admin/users');
        if (res.status === 401) { router.push('/admin/login'); return; }
        if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs');
        const data = await res.json();
        setUsers(data.users);
      }

      if (loadTargets.codes) {
        const res = await fetch('/api/v1/admin/activation-codes');
        if (res.status === 401) { router.push('/admin/login'); return; }
        if (!res.ok) throw new Error('Erreur lors du chargement des codes');
        const data = await res.json();
        setCodes(data.codes);
      }

      if (loadTargets.sessions) {
        const res = await fetch('/api/v1/admin/sessions');
        if (res.status === 401) { router.push('/admin/login'); return; }
        if (!res.ok) throw new Error('Erreur lors du chargement des sessions');
        const data = await res.json();
        setSessions(data.sessions);
        setTotalActiveSessions(data.totalActive);
      }

      if (loadTargets.activity) {
        const days = overrideDays ?? activityDays;
        const res = await fetch(`/api/v1/admin/activity?days=${days}`);
        if (res.status === 401) { router.push('/admin/login'); return; }
        if (!res.ok) throw new Error('Erreur lors du chargement de l\'activite');
        const data = await res.json();
        setActivityData(data);
      }

      if (loadTargets.audit) {
        const params = new URLSearchParams({ page: String(auditPage), limit: '50' });
        if (auditFilter) params.set('action', auditFilter);
        const res = await fetch(`/api/v1/admin/audit-log?${params}`);
        if (res.status === 401) { router.push('/admin/login'); return; }
        if (!res.ok) throw new Error('Erreur lors du chargement du journal');
        const data = await res.json();
        setAuditLogs(data.logs);
        setAuditTotal(data.pagination.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [activeTab, router, activityDays, auditPage, auditFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function switchTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/admin?${params.toString()}`);
  }

  function reloadActivity(days: number) {
    setActivityDays(days);
    loadData(days);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display mb-2 text-3xl font-bold">Tableau de bord</h1>
        <p className="text-[var(--text-secondary)]">
          Gestion des utilisateurs, abonnements et paiements
        </p>
      </div>

      {error && (
        <Card className="mb-6 p-4 bg-accent-subtle border-[var(--border-accent)]">
          <div className="flex items-center gap-2 text-accent">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-accent)]" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && stats && (
            <OverviewTab stats={stats} recentPayments={recentPayments} />
          )}
          {activeTab === 'users' && (
            <UsersTab users={users} onReload={loadData} />
          )}
          {activeTab === 'sessions' && (
            <SessionsTab
              sessions={sessions}
              totalActive={totalActiveSessions}
              onReload={loadData}
            />
          )}
          {activeTab === 'activity' && activityData && (
            <ActivityTab data={activityData} onReload={reloadActivity} />
          )}
          {activeTab === 'codes' && (
            <CodesTab codes={codes} onReload={loadData} />
          )}
          {activeTab === 'payments' && (
            <PaymentsTab users={users} onReload={loadData} onSwitchTab={switchTab} />
          )}
          {activeTab === 'audit' && (
            <AuditTab
              logs={auditLogs}
              total={auditTotal}
              page={auditPage}
              onPageChange={(p) => { setAuditPage(p); }}
              onFilterChange={(action) => { setAuditFilter(action); setAuditPage(1); }}
            />
          )}
        </>
      )}
    </div>
  );
}
