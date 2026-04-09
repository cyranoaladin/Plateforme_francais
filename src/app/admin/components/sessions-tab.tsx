'use client';

import { useState } from 'react';
import { Monitor, Trash2, Clock, User } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { getCsrfToken } from '@/lib/security/csrf-client';

type SessionEntry = {
  userId: string;
  email: string;
  role: string;
  displayName: string | null;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'A l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days}j`;
}

export function SessionsTab({
  sessions,
  totalActive,
  onReload,
}: {
  sessions: SessionEntry[];
  totalActive: number;
  onReload: () => void;
}) {
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revokeUserSessions(userId: string, email: string) {
    if (!confirm(`Revoquer toutes les sessions de ${email} ?`)) return;
    setRevoking(userId);
    setError(null);

    try {
      const csrf = await getCsrfToken();
      const res = await fetch('/api/v1/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur');
      }
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setRevoking(null);
    }
  }

  // Group sessions by user
  const byUser = new Map<string, SessionEntry[]>();
  for (const s of sessions) {
    const existing = byUser.get(s.userId) ?? [];
    existing.push(s);
    byUser.set(s.userId, existing);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Card className="flex-1 p-5">
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-[var(--c-accent)]" />
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Sessions actives</p>
              <p className="text-2xl font-bold">{totalActive}</p>
            </div>
          </div>
        </Card>
        <Card className="flex-1 p-5">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-success" />
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Utilisateurs connectes</p>
              <p className="text-2xl font-bold">{byUser.size}</p>
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <Card className="p-4 bg-accent-subtle border-[var(--border-accent)]">
          <p className="text-sm text-accent">{error}</p>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Sessions actives par utilisateur</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="text-left py-2 px-4">Utilisateur</th>
                <th className="text-left py-2 px-4">Role</th>
                <th className="text-left py-2 px-4">Sessions</th>
                <th className="text-left py-2 px-4">Derniere activite</th>
                <th className="text-left py-2 px-4">Connecte depuis</th>
                <th className="text-left py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(byUser.entries()).map(([userId, userSessions]) => {
                const latest = userSessions.reduce((a, b) =>
                  new Date(a.lastSeenAt) > new Date(b.lastSeenAt) ? a : b
                );
                const isRecent = Date.now() - new Date(latest.lastSeenAt).getTime() < 30 * 60 * 1000;

                return (
                  <tr key={userId} className="border-b border-[var(--border-primary)]">
                    <td className="py-2 px-4">
                      <div>
                        <span className="font-medium">{latest.email}</span>
                        {latest.displayName && (
                          <p className="text-xs text-[var(--text-secondary)]">{latest.displayName}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <Badge>{latest.role}</Badge>
                    </td>
                    <td className="py-2 px-4">
                      <span className="font-mono">{userSessions.length}</span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isRecent ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">{timeAgo(latest.lastSeenAt)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-sm">
                      {new Date(latest.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-4">
                      <Button
                        onClick={() => revokeUserSessions(userId, latest.email)}
                        disabled={revoking === userId}
                        className="text-xs px-3 py-1 bg-[var(--bg-accent-subtle,#fef2f2)] text-[var(--text-accent,#dc2626)] hover:bg-[var(--bg-accent-subtle-hover,#fee2e2)] border-0"
                      >
                        <Trash2 className="w-3 h-3 mr-1 inline" />
                        {revoking === userId ? '...' : 'Revoquer'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {byUser.size === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-secondary)]">
                    Aucune session active
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
