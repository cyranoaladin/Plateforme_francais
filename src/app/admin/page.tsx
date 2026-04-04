'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  CreditCard,
  TrendingUp,
  Key,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Search,
  Filter,
  Download,
  Edit,
  Ban,
  RefreshCw,
  BarChart3,
  Activity,
  Settings,
  Mail,
  Calendar,
  Zap,
  Shield,
  Eye,
  Trash2,
  UserPlus,
  Crown,
  Star,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from 'lucide-react';
import { Card, Button, Input, Badge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui';
import { getAdminDataLoadTargets, type AdminDashboardTab } from '@/lib/admin/dashboard-tab-data';
import { formatPlanLabel, normalizePlanId, PLAN_DISPLAY_LABELS, toPublicPlanId } from '@/lib/billing/plan-catalog';
import { getCsrfToken } from '@/lib/security/csrf-client';

type User = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  } | null;
  profile: {
    globalLevel: string | null;
    classLevel: string | null;
    voie: string | null;
    displayName?: string;
  } | null;
  payments: Array<{
    id: string;
    status: string;
    plan: string;
    amountMillimes: number;
    createdAt: string;
  }>;
  usage: {
    oralSessionsThisMonth: number;
    correctionsThisMonth: number;
    tutorQuestionsToday: number;
    llmTokensToday: number;
  };
  lastLoginAt?: string;
};

type ActivationCode = {
  id: string;
  codeHash: string;
  plan: string;
  durationDays: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  redeemedAt: string | null;
  plainCode?: string; // Seulement lors de la création
};

type Stats = {
  totalUsers: number;
  activeSubscriptions: number;
  pendingPayments: number;
  totalRevenueTND: number;
  subscriptionsByPlan: Array<{ plan: string; count: number }>;
  newUsersThisMonth: number;
  churnRate: number;
  mrr: number;
  arr: number;
  averageRevenuePerUser: number;
  topFeatures: Array<{ feature: string; usage: number }>;
};

type Payment = {
  id: string;
  userId: string;
  status: string;
  plan: string;
  amountMillimes: number;
  orderRef: string;
  createdAt: string;
  user: { email: string };
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>('overview');

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [codes, setCodes] = useState<ActivationCode[]>([]);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'FREE' | 'PREMIUM' | 'PRO'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'PENDING'>('ALL');
  const [sortBy, setSortBy] = useState<'email' | 'createdAt' | 'lastLogin'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Formulaire génération code
  const [newCodePlan, setNewCodePlan] = useState<'PREMIUM' | 'MASTERIUM'>('PREMIUM');
  const [newCodeDuration, setNewCodeDuration] = useState('30');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string | null>(null);

  // Formulaire paiement manuel
  const [selectedUserId, setSelectedUserId] = useState('');
  const [paymentPlan, setPaymentPlan] = useState<'PREMIUM' | 'MASTERIUM'>('PREMIUM');
  const [paymentAmount, setPaymentAmount] = useState('99000');
  const [paymentMethod, setPaymentMethod] = useState<'VIREMENT' | 'ESPECES' | 'AUTRE'>('VIREMENT');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // User management
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActionLoading, setUserActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loadTargets = getAdminDataLoadTargets(activeTab);

      if (loadTargets.stats) {
        const res = await fetch('/api/v1/admin/stats');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          if (res.status === 403) {
            router.push('/dashboard');
            return;
          }
          throw new Error('Erreur lors du chargement des statistiques');
        }
        const data = await res.json();
        setStats(data.stats);
        setRecentPayments(data.recentPayments);
      }

      if (loadTargets.users) {
        const res = await fetch('/api/v1/admin/users');
        if (res.status === 401) { router.push('/login'); return; }
        if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs');
        const data = await res.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      }

      if (loadTargets.codes) {
        const res = await fetch('/api/v1/admin/activation-codes');
        if (res.status === 401) { router.push('/login'); return; }
        if (!res.ok) throw new Error('Erreur lors du chargement des codes');
        const data = await res.json();
        setCodes(data.codes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [activeTab, router]);

  // Filter and sort users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.profile?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Plan filter
    if (planFilter !== 'ALL') {
      filtered = filtered.filter(user => 
        user.subscription ? normalizePlanId(user.subscription.plan) === planFilter : planFilter === 'FREE'
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(user =>
        user.subscription ? user.subscription.status === statusFilter : statusFilter === 'INACTIVE'
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;
      
      switch (sortBy) {
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'lastLogin':
          aValue = a.lastLoginAt || '';
          bValue = b.lastLoginAt || '';
          break;
        case 'createdAt':
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, planFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function generateCode() {
    setGeneratingCode(true);
    setError(null);
    setLastGeneratedCode(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch('/api/v1/admin/activation-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          plan: newCodePlan,
          durationDays: parseInt(newCodeDuration),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la génération du code');
      }

      const data = await res.json();
      setLastGeneratedCode(data.code.plainCode);
      await loadData();
      setNewCodeDuration('30');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setGeneratingCode(false);
    }
  }

  async function validatePayment() {
    if (!selectedUserId || !paymentReference) {
      setError('Veuillez sélectionner un utilisateur et saisir une référence');
      return;
    }

    setProcessingPayment(true);
    setError(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch('/api/v1/admin/manual-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          plan: paymentPlan,
          amountMillimes: parseInt(paymentAmount),
          paymentMethod,
          reference: paymentReference,
          notes: paymentNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la validation du paiement');
      }

      await loadData();
      setSelectedUserId('');
      setPaymentReference('');
      setPaymentNotes('');
      setActiveTab('users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setProcessingPayment(false);
    }
  }

  const planColors: Record<'FREE' | 'PREMIUM' | 'PRO', string> = {
    FREE: 'bg-surface-secondary text-body',
    PREMIUM: 'bg-brand-subtle text-brand',
    PRO: 'bg-brand-subtle text-brand',
  };

  function getVisiblePlanColor(plan: string) {
    return planColors[normalizePlanId(plan)];
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-success-subtle text-success',
    PENDING: 'bg-reward-subtle text-reward',
    ACCEPTED: 'bg-success-subtle text-success',
    REFUSED: 'bg-accent-subtle text-accent',
    CANCELLED: 'bg-surface-secondary text-body',
    PAUSED: 'bg-reward-subtle text-reward',
    INACTIVE: 'bg-surface-secondary text-body',
    CREATED: 'bg-brand-subtle text-brand',
    DELIVERED: 'bg-success-subtle text-success',
    REDEEMED: 'bg-success-subtle text-success',
    REVOKED: 'bg-accent-subtle text-accent',
    SUSPENDED: 'bg-accent-subtle text-accent',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Actif',
    PENDING: 'En attente',
    ACCEPTED: 'Accepté',
    REFUSED: 'Refusé',
    CANCELLED: 'Annulé',
    PAUSED: 'En pause',
    INACTIVE: 'Inactif',
    CREATED: 'Créé',
    DELIVERED: 'Distribué',
    REDEEMED: 'Utilisé',
    REVOKED: 'Révoqué',
    SUSPENDED: 'Suspendu',
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display mb-2 text-3xl font-bold">
            Tableau de bord admin
          </h1>
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

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-[var(--border-primary)]" role="tablist" aria-label="Navigation administration">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] ${
              activeTab === 'overview'
                ? 'border-b-2 border-[var(--c-accent)] text-[var(--c-accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Vue d'ensemble
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] ${
              activeTab === 'users'
                ? 'border-b-2 border-[var(--c-accent)] text-[var(--c-accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Utilisateurs
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'codes'}
            onClick={() => setActiveTab('codes')}
            className={`px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] ${
              activeTab === 'codes'
                ? 'border-b-2 border-[var(--c-accent)] text-[var(--c-accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Codes d'activation
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'payments'}
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] ${
              activeTab === 'payments'
                ? 'border-b-2 border-[var(--c-accent)] text-[var(--c-accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)]'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Paiements manuels
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-accent)]" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Utilisateurs</p>
                        <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
                      </div>
                      <Users className="w-8 h-8 text-[var(--c-accent)]" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Abonnements actifs</p>
                        <p className="text-2xl font-bold mt-1">{stats.activeSubscriptions}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Paiements en attente</p>
                        <p className="text-2xl font-bold mt-1">{stats.pendingPayments}</p>
                      </div>
                      <Clock className="w-8 h-8 text-warning" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Revenu total</p>
                        <p className="text-2xl font-bold mt-1">{stats.totalRevenueTND.toFixed(2)} TND</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-success" />
                    </div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">Répartition par plan</h2>
                  <div className="space-y-2">
                    {stats.subscriptionsByPlan.map((item) => (
                      <div key={item.plan} className="flex items-center justify-between">
                        <span className="font-medium">{formatPlanLabel(item.plan)}</span>
                        <Badge className={getVisiblePlanColor(item.plan)}>
                          {item.count} utilisateur{item.count > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">Derniers paiements</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border-primary)]">
                          <th className="text-left py-2 px-4">Email</th>
                          <th className="text-left py-2 px-4">Plan</th>
                          <th className="text-left py-2 px-4">Montant</th>
                          <th className="text-left py-2 px-4">Statut</th>
                          <th className="text-left py-2 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPayments.map((payment) => (
                          <tr key={payment.id} className="border-b border-[var(--border-primary)]">
                            <td className="py-2 px-4">{payment.user.email}</td>
                            <td className="py-2 px-4">
                              <Badge className={getVisiblePlanColor(payment.plan)}>{formatPlanLabel(payment.plan)}</Badge>
                            </td>
                            <td className="py-2 px-4">{(payment.amountMillimes / 1000).toFixed(2)} TND</td>
                            <td className="py-2 px-4">
                              <Badge className={statusColors[payment.status]}>{statusLabels[payment.status] || payment.status}</Badge>
                            </td>
                            <td className="py-2 px-4">
                              {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Liste des utilisateurs</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border-primary)]">
                        <th className="text-left py-2 px-4">Email</th>
                        <th className="text-left py-2 px-4">Rôle</th>
                        <th className="text-left py-2 px-4">Plan</th>
                        <th className="text-left py-2 px-4">Statut</th>
                        <th className="text-left py-2 px-4">Inscription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-[var(--border-primary)]">
                          <td className="py-2 px-4">{user.email}</td>
                          <td className="py-2 px-4">
                            <Badge>{user.role}</Badge>
                          </td>
                          <td className="py-2 px-4">
                            {user.subscription ? (
                              <Badge className={getVisiblePlanColor(user.subscription.plan)}>
                                {PLAN_DISPLAY_LABELS[normalizePlanId(user.subscription.plan)] || formatPlanLabel(user.subscription.plan)}
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
                            {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Codes Tab */}
            {activeTab === 'codes' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">Générer un code d'activation</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Plan</label>
                      <select
                        id="new-code-plan"
                        value={newCodePlan}
                        onChange={(e) => setNewCodePlan(e.target.value as 'PREMIUM' | 'MASTERIUM')}
                        className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg"
                      >
                        <option value="PREMIUM">Premium (99 TND/mois)</option>
                        <option value="MASTERIUM">Masterium (129 TND/mois)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Durée (jours)</label>
                      <Input
                        type="number"
                        value={newCodeDuration}
                        onChange={(e) => setNewCodeDuration(e.target.value)}
                        disabled={false}
                        placeholder="30"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={generateCode}
                        disabled={generatingCode}
                        className="w-full"
                      >
                        {generatingCode ? 'Génération...' : 'Générer'}
                      </Button>
                    </div>
                  </div>
                </Card>

                {lastGeneratedCode && (
                  <Card className="p-6 bg-success-subtle border-[var(--border-success)]">
                    <h3 className="text-lg font-bold mb-2 text-success">✅ Code généré avec succès !</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-success mb-1">Copiez ce code et communiquez-le à l'utilisateur :</p>
                        <code className="block p-3 bg-surface border border-[var(--border-success)] rounded font-mono text-xl font-bold text-heading">
                          {lastGeneratedCode}
                        </code>
                      </div>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(lastGeneratedCode);
                          alert('Code copié dans le presse-papier !');
                        }}
                        className="bg-success hover:bg-[var(--c-success-hover,var(--color-emerald-700))]"
                      >
                        Copier
                      </Button>
                    </div>
                    <p className="text-xs text-success mt-2">⚠️ Ce code ne sera plus affiché. Assurez-vous de le sauvegarder.</p>
                  </Card>
                )}

                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">Codes d'activation</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border-primary)]">
                          <th className="text-left py-2 px-4">Hash (8 premiers)</th>
                          <th className="text-left py-2 px-4">Plan</th>
                          <th className="text-left py-2 px-4">Durée</th>
                          <th className="text-left py-2 px-4">Statut</th>
                          <th className="text-left py-2 px-4">Créé le</th>
                          <th className="text-left py-2 px-4">Utilisé le</th>
                        </tr>
                      </thead>
                      <tbody>
                        {codes.map((code) => (
                          <tr key={code.id} className="border-b border-[var(--border-primary)]">
                            <td className="py-2 px-4 font-mono text-xs">{code.codeHash.substring(0, 8)}...</td>
                            <td className="py-2 px-4">
                              <Badge className={getVisiblePlanColor(code.plan)}>{formatPlanLabel(code.plan)}</Badge>
                            </td>
                            <td className="py-2 px-4">
                              {code.durationDays >= 365 ? `${Math.round(code.durationDays / 365)} an(s)` : `${code.durationDays} jours`}
                            </td>
                            <td className="py-2 px-4">
                              <Badge className={code.status === 'REDEEMED' ? 'bg-success-subtle text-success' : code.status === 'CREATED' ? 'bg-brand-subtle text-brand' : 'bg-surface-secondary text-body'}>
                                {statusLabels[code.status] || code.status}
                              </Badge>
                            </td>
                            <td className="py-2 px-4">
                              {new Date(code.createdAt).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="py-2 px-4">
                              {code.redeemedAt ? new Date(code.redeemedAt).toLocaleDateString('fr-FR') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Valider un paiement manuel</h2>
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium mb-2">Utilisateur</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg"
                    >
                      <option value="">Sélectionner un utilisateur</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email} ({formatPlanLabel(user.subscription?.plan || 'FREE')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Plan</label>
                      <select
                        id="manual-payment-plan"
                        value={paymentPlan}
                        onChange={(e) => {
                          const plan = e.target.value as 'PREMIUM' | 'MASTERIUM';
                          setPaymentPlan(plan);
                          setPaymentAmount(plan === 'PREMIUM' ? '99000' : '129000');
                        }}
                        className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg"
                      >
                        <option value="PREMIUM">Premium (99 TND/mois)</option>
                        <option value="MASTERIUM">Masterium (129 TND/mois)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Montant (millimes)</label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="99000"
                      />
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {(parseInt(paymentAmount) / 1000).toFixed(2)} TND
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Méthode de paiement</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as 'VIREMENT' | 'ESPECES' | 'AUTRE')}
                        className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg"
                      >
                        <option value="VIREMENT">Virement bancaire</option>
                        <option value="ESPECES">Espèces</option>
                        <option value="AUTRE">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Référence *</label>
                      <Input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="REF-2026-001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Notes (optionnel)</label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg"
                      rows={3}
                      placeholder="Informations complémentaires..."
                    />
                  </div>

                  <Button
                    onClick={validatePayment}
                    disabled={processingPayment || !selectedUserId || !paymentReference}
                    className="w-full"
                  >
                    {processingPayment ? 'Validation en cours...' : 'Valider le paiement et activer l\u2019abonnement'}
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
