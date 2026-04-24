'use client';

import { useState } from 'react';
import { Mail, RefreshCw, MoreHorizontal, UserPlus, Ban, Search } from '@/components/ui/icons';
import {
  Card,
  Badge,
  Button,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import {
  formatPlanLabel,
  normalizePlanId,
  PLAN_DISPLAY_LABELS,
} from '@/lib/billing/plan-catalog';
import { getCsrfToken } from '@/lib/security/csrf-client';
import {
  type AdminUser,
  getVisiblePlanColor,
  statusColors,
  statusLabels,
} from './shared';

export function UsersTab({
  users,
  onReload,
}: {
  users: AdminUser[];
  onReload: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'FREE' | 'PREMIUM' | 'PRO'>('ALL');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'eleve' | 'enseignant' | 'parent' | 'admin'>('eleve');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter users
  let filtered = users;
  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.profile?.displayName?.toLowerCase().includes(q),
    );
  }
  if (planFilter !== 'ALL') {
    filtered = filtered.filter((u) =>
      u.subscription ? normalizePlanId(u.subscription.plan) === planFilter : planFilter === 'FREE',
    );
  }

  async function createUser() {
    if (!newEmail || !newPassword) return;
    setCreating(true);
    setError(null);
    setCreateMessage(null);

    try {
      const csrf = await getCsrfToken();
      const res = await fetch('/api/v1/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
          displayName: newDisplayName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setCreateMessage(data.message);
      setNewEmail('');
      setNewPassword('');
      setNewDisplayName('');
      setShowCreateForm(false);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setCreating(false);
    }
  }

  async function suspendUser(userId: string, email: string) {
    if (!confirm(`Suspendre ${email} ? Toutes ses sessions seront revoquees.`)) return;
    try {
      const csrf = await getCsrfToken();
      const res = await fetch('/api/v1/admin/users/suspend', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      onReload();
    } catch (err) {
      alert(`Erreur : ${err instanceof Error ? err.message : 'Echec'}`);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="p-4 bg-accent-subtle border-[var(--border-accent)]">
          <p className="text-sm text-accent">{error}</p>
        </Card>
      )}
      {createMessage && (
        <Card className="p-4 bg-success-subtle border-[var(--border-success)]">
          <p className="text-sm text-success">{createMessage}</p>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par email ou nom..."
            className="w-full pl-9 pr-3 py-2 border border-[var(--border-primary)] rounded-lg text-sm bg-[var(--bg-primary)]"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as typeof planFilter)}
          className="px-3 py-2 border border-[var(--border-primary)] rounded-lg text-sm"
        >
          <option value="ALL">Tous les plans</option>
          <option value="FREE">Freemium</option>
          <option value="PREMIUM">Premium</option>
          <option value="PRO">Masterium</option>
        </select>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="text-sm">
          <UserPlus className="w-4 h-4 mr-1 inline" />
          Ajouter
        </Button>
      </div>

      {/* Create user form */}
      {showCreateForm && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Creer un utilisateur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mot de passe *</label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="min. 8 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as typeof newRole)}
                className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg text-sm"
              >
                <option value="eleve">Eleve</option>
                <option value="enseignant">Enseignant</option>
                <option value="parent">Parent</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nom affiche</label>
              <Input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Optionnel"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={createUser}
              disabled={creating || !newEmail || !newPassword || newPassword.length < 8}
            >
              {creating ? 'Creation...' : 'Creer le compte'}
            </Button>
            <Button
              onClick={() => setShowCreateForm(false)}
              className="bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]"
            >
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {/* Users table */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">
          Utilisateurs ({filtered.length}/{users.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="text-left py-2 px-4">Email</th>
                <th className="text-left py-2 px-4">Role</th>
                <th className="text-left py-2 px-4">Plan</th>
                <th className="text-left py-2 px-4">Statut</th>
                <th className="text-left py-2 px-4">Onboarding</th>
                <th className="text-left py-2 px-4">Inscription</th>
                <th className="text-left py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-[var(--border-primary)]">
                  <td className="py-2 px-4">
                    <div>
                      <span>{user.email}</span>
                      {user.profile?.displayName && (
                        <p className="text-xs text-[var(--text-secondary)]">
                          {user.profile.displayName}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <Badge>{user.role}</Badge>
                  </td>
                  <td className="py-2 px-4">
                    {user.subscription ? (
                      <Badge className={getVisiblePlanColor(user.subscription.plan)}>
                        {PLAN_DISPLAY_LABELS[normalizePlanId(user.subscription.plan)] ||
                          formatPlanLabel(user.subscription.plan)}
                      </Badge>
                    ) : (
                      <span className="text-[var(--text-secondary)]">Aucun</span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {user.subscription ? (
                      <Badge className={statusColors[user.subscription.status]}>
                        {statusLabels[user.subscription.status] || user.subscription.status}
                      </Badge>
                    ) : (
                      <span className="text-[var(--text-secondary)]">-</span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {user.role === 'eleve' ? (
                      user.profile?.onboardingCompleted ? (
                        <Badge className="bg-emerald-100 text-emerald-800">Fait</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800">En attente</Badge>
                      )
                    ) : (
                      <span className="text-[var(--text-secondary)]">-</span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-2 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-[var(--bg-surface-secondary)]"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={async () => {
                            if (!confirm(`Envoyer un reset mot de passe a ${user.email} ?`)) return;
                            try {
                              const csrf = await getCsrfToken();
                              const res = await fetch('/api/v1/admin/users/reset-password', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
                                body: JSON.stringify({ userId: user.id }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error);
                              alert(data.message);
                            } catch (err) {
                              alert(`Erreur : ${err instanceof Error ? err.message : 'Echec'}`);
                            }
                          }}
                        >
                          <Mail className="h-4 w-4 mr-2" /> Reset mot de passe
                        </DropdownMenuItem>
                        {user.role === 'eleve' && (
                          <DropdownMenuItem
                            onClick={async () => {
                              if (!confirm(`Reinitialiser l'onboarding de ${user.email} ?`)) return;
                              try {
                                const csrf = await getCsrfToken();
                                const res = await fetch('/api/v1/admin/users/reset-onboarding', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
                                  body: JSON.stringify({ userId: user.id }),
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error);
                                alert(data.message);
                                onReload();
                              } catch (err) {
                                alert(`Erreur : ${err instanceof Error ? err.message : 'Echec'}`);
                              }
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" /> Reset onboarding
                          </DropdownMenuItem>
                        )}
                        {user.role !== 'admin' && (
                          <DropdownMenuItem onClick={() => suspendUser(user.id, user.email)}>
                            <Ban className="h-4 w-4 mr-2" /> Suspendre
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-secondary)]">
                    Aucun utilisateur trouve
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
