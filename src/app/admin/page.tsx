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
} from 'lucide-react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

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
  } | null;
  payments: Array<{
    id: string;
    status: string;
    plan: string;
    amountMillimes: number;
    createdAt: string;
  }>;
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

const EDITORIAL_HEADING = {
  fontFamily: 'var(--font-display)',
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'codes' | 'payments'>('overview');

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [codes, setCodes] = useState<ActivationCode[]>([]);

  // Formulaire génération code
  const [newCodePlan, setNewCodePlan] = useState<'PREMIUM' | 'PRO' | 'MAX'>('PREMIUM');
  const [newCodeDuration, setNewCodeDuration] = useState('30');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string | null>(null);

  // Formulaire paiement manuel
  const [selectedUserId, setSelectedUserId] = useState('');
  const [paymentPlan, setPaymentPlan] = useState<'PREMIUM' | 'PRO' | 'MAX'>('PREMIUM');
  const [paymentAmount, setPaymentAmount] = useState('99000');
  const [paymentMethod, setPaymentMethod] = useState<'VIREMENT' | 'ESPECES' | 'AUTRE'>('VIREMENT');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'overview') {
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
      } else if (activeTab === 'users') {
        const res = await fetch('/api/v1/admin/users');
        if (res.status === 401) { router.push('/login'); return; }
        if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs');
        const data = await res.json();
        setUsers(data.users);
      } else if (activeTab === 'codes') {
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function generateCode() {
    setGeneratingCode(true);
    setError(null);
    setLastGeneratedCode(null);

    try {
      const csrfToken = getCsrfTokenFromDocument();
      const res = await fetch('/api/v1/admin/activation-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          plan: newCodePlan,
          durationDays: newCodePlan === 'MAX' ? undefined : parseInt(newCodeDuration),
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
      const csrfToken = getCsrfTokenFromDocument();
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

  const planColors: Record<string, string> = {
    FREE: 'bg-gray-100 text-gray-800',
    PREMIUM: 'bg-blue-100 text-blue-800',
    PRO: 'bg-purple-100 text-purple-800',
    MAX: 'bg-gold-100 text-gold-800',
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REFUSED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={EDITORIAL_HEADING}>
            Dashboard Admin
          </h1>
          <p className="text-[var(--text-secondary)]">
            Gestion des utilisateurs, abonnements et paiements
          </p>
        </div>

        {error && (
          <Card className="mb-6 p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--border-primary)]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'codes'
                ? 'border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Codes d'activation
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'payments'
                ? 'border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Paiements manuels
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
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
                      <Users className="w-8 h-8 text-[var(--accent-primary)]" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Abonnements actifs</p>
                        <p className="text-2xl font-bold mt-1">{stats.activeSubscriptions}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Paiements en attente</p>
                        <p className="text-2xl font-bold mt-1">{stats.pendingPayments}</p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Revenu total</p>
                        <p className="text-2xl font-bold mt-1">{stats.totalRevenueTND.toFixed(2)} TND</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">Répartition par plan</h2>
                  <div className="space-y-2">
                    {stats.subscriptionsByPlan.map((item) => (
                      <div key={item.plan} className="flex items-center justify-between">
                        <span className="font-medium">{item.plan}</span>
                        <Badge className={planColors[item.plan] || 'bg-gray-100'}>
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
                              <Badge className={planColors[payment.plan]}>{payment.plan}</Badge>
                            </td>
                            <td className="py-2 px-4">{(payment.amountMillimes / 1000).toFixed(2)} TND</td>
                            <td className="py-2 px-4">
                              <Badge className={statusColors[payment.status]}>{payment.status}</Badge>
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
                              <Badge className={planColors[user.subscription.plan]}>
                                {user.subscription.plan}
                              </Badge>
                            ) : (
                              <span className="text-[var(--text-secondary)]">Aucun</span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {user.subscription ? (
                              <Badge className={statusColors[user.subscription.status]}>
                                {user.subscription.status}
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
                        value={newCodePlan}
                        onChange={(e) => setNewCodePlan(e.target.value as 'PREMIUM' | 'PRO' | 'MAX')}
                        className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg"
                      >
                        <option value="PREMIUM">PREMIUM (99 TND/mois)</option>
                        <option value="PRO">PRO (129 TND/mois)</option>
                        <option value="MAX">MAX (Lifetime)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Durée (jours)</label>
                      <Input
                        type="number"
                        value={newCodeDuration}
                        onChange={(e) => setNewCodeDuration(e.target.value)}
                        disabled={newCodePlan === 'MAX'}
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
                  <Card className="p-6 bg-green-50 border-green-200">
                    <h3 className="text-lg font-bold mb-2 text-green-800">✅ Code généré avec succès !</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-green-700 mb-1">Copiez ce code et communiquez-le à l'utilisateur :</p>
                        <code className="block p-3 bg-white border border-green-300 rounded font-mono text-xl font-bold text-green-900">
                          {lastGeneratedCode}
                        </code>
                      </div>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(lastGeneratedCode);
                          alert('Code copié dans le presse-papier !');
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Copier
                      </Button>
                    </div>
                    <p className="text-xs text-green-600 mt-2">⚠️ Ce code ne sera plus affiché. Assurez-vous de le sauvegarder.</p>
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
                              <Badge className={planColors[code.plan]}>{code.plan}</Badge>
                            </td>
                            <td className="py-2 px-4">
                              {code.durationDays >= 365 ? `${Math.round(code.durationDays / 365)} an(s)` : `${code.durationDays} jours`}
                            </td>
                            <td className="py-2 px-4">
                              <Badge className={code.status === 'REDEEMED' ? 'bg-green-100 text-green-800' : code.status === 'CREATED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                                {code.status}
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
                          {user.email} ({user.subscription?.plan || 'FREE'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Plan</label>
                      <select
                        value={paymentPlan}
                        onChange={(e) => {
                          const plan = e.target.value as 'PREMIUM' | 'PRO' | 'MAX';
                          setPaymentPlan(plan);
                          setPaymentAmount(plan === 'PREMIUM' ? '99000' : plan === 'PRO' ? '129000' : '149000');
                        }}
                        className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg"
                      >
                        <option value="PREMIUM">PREMIUM (99 TND/mois)</option>
                        <option value="PRO">PRO (129 TND/mois)</option>
                        <option value="MAX">MAX (149 TND lifetime)</option>
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
                    {processingPayment ? 'Validation en cours...' : 'Valider le paiement et activer l\'abonnement'}
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
