'use client';

import { useState } from 'react';
import { FileText, Download } from '@/components/ui/icons';
import { Card, Badge, Button } from '@/components/ui';

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

const ACTION_LABELS: Record<string, string> = {
  'user.create': 'Creation utilisateur',
  'user.suspend': 'Suspension',
  'user.reset-password': 'Reset mot de passe',
  'user.reset-onboarding': 'Reset onboarding',
  'user.plan-change': 'Changement de plan',
  'session.revoke': 'Revocation session',
  'code.generate': 'Generation code',
  'code.revoke': 'Revocation code',
  'payment.manual': 'Paiement manuel',
  'payment.confirm': 'Confirmation commande',
};

const ACTION_COLORS: Record<string, string> = {
  'user.create': 'bg-success-subtle text-success',
  'user.suspend': 'bg-accent-subtle text-accent',
  'user.reset-password': 'bg-reward-subtle text-reward',
  'user.reset-onboarding': 'bg-reward-subtle text-reward',
  'user.plan-change': 'bg-brand-subtle text-brand',
  'session.revoke': 'bg-accent-subtle text-accent',
  'code.generate': 'bg-success-subtle text-success',
  'code.revoke': 'bg-accent-subtle text-accent',
  'payment.manual': 'bg-brand-subtle text-brand',
  'payment.confirm': 'bg-success-subtle text-success',
};

export function AuditTab({
  logs,
  total,
  page,
  onPageChange,
  onFilterChange,
}: {
  logs: AuditEntry[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onFilterChange: (action: string | null) => void;
}) {
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const totalPages = Math.ceil(total / 50);

  function exportCsv() {
    const headers = ['Date', 'Admin', 'Action', 'Cible', 'Details', 'IP'];
    const rows = logs.map((l) => [
      new Date(l.createdAt).toLocaleString('fr-FR'),
      l.adminEmail,
      ACTION_LABELS[l.action] ?? l.action,
      l.targetType ? `${l.targetType}:${l.targetId}` : '-',
      l.details ? JSON.stringify(l.details) : '-',
      l.ip ?? '-',
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[var(--c-accent)]" />
          <h2 className="text-xl font-bold">Journal d'audit ({total})</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterAction ?? ''}
            onChange={(e) => {
              const v = e.target.value || null;
              setFilterAction(v);
              onFilterChange(v);
            }}
            className="px-3 py-1.5 border border-[var(--border-primary)] rounded-lg text-sm"
          >
            <option value="">Toutes les actions</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <Button onClick={exportCsv} className="text-sm px-3 py-1.5 bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]">
            <Download className="w-4 h-4 mr-1 inline" />
            CSV
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-left py-2 px-3">Admin</th>
                <th className="text-left py-2 px-3">Action</th>
                <th className="text-left py-2 px-3">Cible</th>
                <th className="text-left py-2 px-3">Details</th>
                <th className="text-left py-2 px-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--border-primary)]">
                  <td className="py-2 px-3 text-[var(--text-secondary)] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2 px-3">{log.adminEmail}</td>
                  <td className="py-2 px-3">
                    <Badge className={ACTION_COLORS[log.action] ?? 'bg-surface-secondary text-body'}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 font-mono text-xs">
                    {log.targetType ? (
                      <span>
                        {log.targetType}
                        {log.targetId && <span className="text-[var(--text-secondary)]">:{log.targetId.slice(0, 8)}</span>}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-2 px-3 max-w-xs truncate">
                    {log.details ? (
                      <span className="text-xs text-[var(--text-secondary)]" title={JSON.stringify(log.details)}>
                        {Object.entries(log.details as Record<string, unknown>)
                          .slice(0, 3)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-2 px-3 font-mono text-xs text-[var(--text-secondary)]">
                    {log.ip ?? '-'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-secondary)]">
                    Aucune entree dans le journal d'audit
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">
              Page {page}/{totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="text-sm px-3 py-1 bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]"
              >
                Precedent
              </Button>
              <Button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="text-sm px-3 py-1 bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
