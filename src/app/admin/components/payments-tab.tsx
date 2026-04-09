'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { formatPlanLabel } from '@/lib/billing/plan-catalog';
import { getCsrfToken } from '@/lib/security/csrf-client';
import { type AdminUser } from './shared';

export function PaymentsTab({
  users,
  onReload,
  onSwitchTab,
}: {
  users: AdminUser[];
  onReload: () => void;
  onSwitchTab: (tab: string) => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [paymentPlan, setPaymentPlan] = useState<'PREMIUM' | 'MASTERIUM'>('PREMIUM');
  const [paymentAmount, setPaymentAmount] = useState('99000');
  const [paymentMethod, setPaymentMethod] = useState<'VIREMENT' | 'ESPECES' | 'AUTRE'>('VIREMENT');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function validatePayment() {
    if (!selectedUserId || !paymentReference) {
      setError('Veuillez selectionner un utilisateur et saisir une reference');
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

      onReload();
      setSelectedUserId('');
      setPaymentReference('');
      setPaymentNotes('');
      onSwitchTab('users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setProcessingPayment(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Valider un paiement manuel</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-accent-subtle border border-[var(--border-accent)] text-sm text-accent">
          {error}
        </div>
      )}

      <div className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-2">Utilisateur</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg"
          >
            <option value="">Selectionner un utilisateur</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email} ({formatPlanLabel(user.subscription?.plan || 'FREE')})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="manual-payment-plan" className="block text-sm font-medium mb-2">Plan</label>
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
            <label className="block text-sm font-medium mb-2">Methode de paiement</label>
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as 'VIREMENT' | 'ESPECES' | 'AUTRE')
              }
              className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg"
            >
              <option value="VIREMENT">Virement bancaire</option>
              <option value="ESPECES">Especes</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reference *</label>
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
            placeholder="Informations complementaires..."
          />
        </div>

        <Button
          onClick={validatePayment}
          disabled={processingPayment || !selectedUserId || !paymentReference}
          className="w-full"
        >
          {processingPayment
            ? 'Validation en cours...'
            : "Valider le paiement et activer l'abonnement"}
        </Button>
      </div>
    </Card>
  );
}
