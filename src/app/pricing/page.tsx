'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type SubscriptionPlan = 'FREE' | 'MONTHLY' | 'LIFETIME';
type PaymentStatus = 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'ERROR';
type ClicToPayPlan = 'MONTHLY' | 'LIFETIME';

type BillingStatusPayload = {
  subscription: {
    plan: SubscriptionPlan;
    status: string;
    currentPeriodEnd: string | null;
  };
  lastPayment: {
    orderRef: string;
    status: PaymentStatus;
    amountMillimes: number;
    createdAt: string;
  } | null;
};

const planCards: Array<{
  id: SubscriptionPlan;
  title: string;
  price: string;
  subtitle: string;
  cta: string;
  clicToPayPlan?: ClicToPayPlan;
}> = [
  {
    id: 'FREE',
    title: 'Découverte',
    price: '0 TND',
    subtitle: 'Parfait pour commencer',
    cta: 'Plan actuel',
  },
  {
    id: 'MONTHLY',
    title: 'Mensuel',
    price: '14,90 TND/mois',
    subtitle: '7 jours d’essai puis renouvellement mensuel',
    cta: 'Essayer 7 jours',
    clicToPayPlan: 'MONTHLY',
  },
  {
    id: 'LIFETIME',
    title: 'Accès à vie',
    price: '89 TND',
    subtitle: 'Paiement unique, accès permanent',
    cta: 'Activer à vie',
    clicToPayPlan: 'LIFETIME',
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPlan, setPendingPlan] = useState<ClicToPayPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/payments/clictopay/status', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Impossible de charger votre statut de facturation.');
        }
        const payload = (await response.json()) as BillingStatusPayload;
        setBilling(payload);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const currentPlan = billing?.subscription.plan ?? 'FREE';
  const currentPeriodEndLabel = useMemo(() => {
    const value = billing?.subscription.currentPeriodEnd;
    if (!value) return null;
    return new Date(value).toLocaleDateString('fr-FR');
  }, [billing?.subscription.currentPeriodEnd]);

  const startCheckout = async (plan: ClicToPayPlan) => {
    setError(null);
    setPendingPlan(plan);

    try {
      const response = await fetch('/api/payments/clictopay/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        throw new Error('Impossible de démarrer le paiement ClicToPay.');
      }

      const payload = (await response.json()) as { checkoutUrl?: string };
      if (!payload.checkoutUrl) {
        throw new Error('URL de paiement introuvable.');
      }

      window.location.assign(payload.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
      setPendingPlan(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Offres Nexus Réussite EAF</h1>
        <p className="text-muted-foreground">
          Paiement sécurisé par ClicToPay (cartes nationales et internationales, CVV2 et 3D Secure).
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-border bg-card p-5">
        {loading && <p>Chargement de votre abonnement…</p>}
        {!loading && (
          <div className="space-y-1 text-sm">
            <p>
              Plan actif: <strong>{currentPlan}</strong>
            </p>
            <p>
              Statut: <strong>{billing?.subscription.status ?? 'ACTIVE'}</strong>
            </p>
            {currentPeriodEndLabel && (
              <p>
                Échéance: <strong>{currentPeriodEndLabel}</strong>
              </p>
            )}
            {billing?.lastPayment && (
              <p>
                Dernier paiement: <strong>{billing.lastPayment.status}</strong> ({(billing.lastPayment.amountMillimes / 1000).toFixed(3)}{' '}
                TND)
              </p>
            )}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {planCards.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isPaidCard = Boolean(plan.clicToPayPlan);
          const isLoadingPlan = pendingPlan !== null && plan.clicToPayPlan === pendingPlan;

          return (
            <article
              key={plan.id}
              className={`rounded-2xl border p-6 shadow-sm transition hover:shadow-md ${isCurrent ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{plan.title}</p>
              <p className="mt-2 text-3xl font-semibold">{plan.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.subtitle}</p>

              <button
                type="button"
                disabled={isCurrent || !isPaidCard || pendingPlan !== null}
                onClick={() => {
                  if (plan.clicToPayPlan) {
                    void startCheckout(plan.clicToPayPlan);
                  }
                }}
                className="mt-6 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoadingPlan ? 'Redirection…' : isCurrent ? 'Plan actuel' : plan.cta}
              </button>
            </article>
          );
        })}
      </section>

      {error && (
        <p className="mt-6 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
