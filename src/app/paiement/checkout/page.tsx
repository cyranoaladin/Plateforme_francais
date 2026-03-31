'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Landmark,
  Loader2,
  Smartphone,
} from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api/client';
import { track } from '@/components/analytics/events';
import { StateNotice, Surface } from '@/components/ui';

type PlanKey = 'PREMIUM' | 'MASTERIUM';
type PaymentMethod = 'virement' | 'espèces';

const PLAN_INFO: Record<PlanKey, { label: string; price: string; priceTnd: number; bullets: string[] }> = {
  PREMIUM: {
    label: 'Premium',
    price: '99 TND / mois',
    priceTnd: 99,
    bullets: [
      '10 simulations orales / semaine',
      '20 corrections écrites / mois',
      '100 échanges guidés / jour',
      'Rapport PDF oral',
      'Bibliothèque complète',
    ],
  },
  MASTERIUM: {
    label: 'Masterium',
    price: '129 TND / mois',
    priceTnd: 129,
    bullets: [
      'Oral, écrit et quiz illimités',
      'Recherche avancée dans le corpus',
      'Historique oral complet',
      'Support prioritaire',
      'Bibliothèque complète',
    ],
  },
};

type OrderResult = {
  orderId: string;
  reference: string;
  amount: string;
  currency: string;
  plan: string;
  method: string;
  instructions: string;
};

const EDITORIAL_HEADING = {
  fontFamily: 'var(--font-display)',
};

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const planParam = (searchParams.get('plan') ?? '').toUpperCase();
  const plan: PlanKey | null =
    planParam === 'PREMIUM' || planParam === 'MASTERIUM' ? planParam : null;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);

  useEffect(() => {
    if (plan) {
      track({ name: 'checkout_view', props: { plan } });
    }
  }, [plan]);

  if (!plan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-surface-secondary)] px-4 py-12">
        <div className="mx-auto max-w-md text-center">
          <h1
            style={EDITORIAL_HEADING}
            className="text-2xl font-bold text-[var(--text-heading)]"
          >
            Plan non reconnu
          </h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Ajoute <code>?plan=PREMIUM</code> ou <code>?plan=MASTERIUM</code> pour
            accéder au paiement.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--c-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--text-on-primary)] transition-all hover:-translate-y-0.5 hover:bg-[var(--c-primary-active)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voir les plans
          </Link>
        </div>
      </main>
    );
  }

  const info = PLAN_INFO[plan];

  const handleOrder = async (method: PaymentMethod) => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    track({ name: 'checkout_order_submit', props: { plan, method } });

    try {
      const result = await apiFetch<OrderResult>('/api/v1/billing/order', {
        method: 'POST',
        json: { plan, method },
      });
      setOrder(result);
      track({
        name: 'checkout_order_success',
        props: { plan, method, reference: result.reference },
      });
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError('Erreur inattendue. Vérifie ta connexion.');
      }
      track({ name: 'checkout_order_error', props: { plan, method } });
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Confirmation state ----
  if (order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-surface-secondary)] px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-subtle text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h1
            style={EDITORIAL_HEADING}
            className="mt-6 text-3xl font-bold text-[var(--text-heading)]"
          >
            Commande enregistrée
          </h1>

          <Surface tone="default" padding="md" className="mt-6 text-left">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Référence
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-[var(--c-primary)]">
                  {order.reference}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Montant
                </p>
                <p className="mt-1 text-lg font-bold text-[var(--text-heading)]">
                  {order.amount} {order.currency}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Plan
                </p>
                <p className="mt-1 font-semibold text-[var(--text-heading)]">
                  {order.plan}
                </p>
              </div>
            </div>

            <hr className="my-4 border-[var(--border-default)]" />

            <p className="text-sm leading-7 text-[var(--text-body)]">
              {order.instructions}
            </p>
          </Surface>

          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Ton abonnement sera activé dès réception et vérification du paiement par
            notre équipe.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--c-primary)] px-6 py-3 text-sm font-semibold text-[var(--text-on-primary)] transition-all hover:-translate-y-0.5 hover:bg-[var(--c-primary-active)]"
            >
              Retour au tableau de bord
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] px-6 py-3 text-sm font-semibold text-[var(--text-heading)] transition-colors hover:bg-[var(--bg-surface)]"
            >
              Voir les plans
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ---- Checkout state ----
  return (
    <div className="min-h-screen bg-[var(--bg-surface-secondary)] text-[var(--text-heading)]">
      <main className="relative mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--c-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux plans
        </Link>

        <h1
          style={EDITORIAL_HEADING}
          className="mt-8 text-3xl font-bold tracking-[-0.03em] text-[var(--c-primary)] sm:text-4xl"
        >
          Finaliser ta commande
        </h1>

        {/* Plan summary */}
        <Surface tone="default" padding="md" className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2
              style={EDITORIAL_HEADING}
              className="text-2xl font-bold text-[var(--text-heading)]"
            >
              {info.label}
            </h2>
            <span className="text-xl font-bold text-[var(--c-primary)]">
              {info.price}
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {info.bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2 text-sm text-[var(--text-body)]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--c-success)]" />
                {b}
              </li>
            ))}
          </ul>
        </Surface>

        {/* Payment methods */}
        <h2
          style={EDITORIAL_HEADING}
          className="mt-10 text-xl font-bold text-[var(--text-heading)]"
        >
          Choisis ton moyen de paiement
        </h2>

        {error ? (
          <div className="mt-4">
            <StateNotice title="Paiement non initié" description={error} variant="error" />
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Virement */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleOrder('virement')}
            className="group flex flex-col items-start gap-4 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/85 p-6 text-left shadow-[var(--shadow-md)] transition-all hover:-translate-y-0.5 hover:border-[var(--c-primary)] hover:shadow-lg disabled:opacity-60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--c-primary)]/10 text-[var(--c-primary)]">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-heading)]">
                Virement bancaire
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Transfère le montant sur notre compte avec ta référence de commande.
              </p>
            </div>
            <span className="mt-auto inline-flex items-center gap-2 rounded-full bg-[var(--c-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--bg-page)] transition-all group-hover:bg-[var(--c-primary-active)]">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Commander par virement
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </span>
          </button>

          {/* Espèces */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleOrder('espèces')}
            className="group flex flex-col items-start gap-4 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/85 p-6 text-left shadow-[var(--shadow-md)] transition-all hover:-translate-y-0.5 hover:border-[var(--c-primary)] hover:shadow-lg disabled:opacity-60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--c-success)]/10 text-[var(--c-success)]">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-heading)]">
                Paiement en espèces
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Règlement en espèces avec référence de commande.
              </p>
            </div>
            <span className="mt-auto inline-flex items-center gap-2 rounded-full bg-[var(--c-success)] px-5 py-2.5 text-sm font-semibold text-white transition-all group-hover:brightness-110">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Commander en espèces
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </span>
          </button>

          <div className="col-span-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]/50 p-4 text-center text-sm text-[var(--text-muted)]">
            Au lancement, le paiement se fait uniquement par virement bancaire ou en espèces.
            <br />
            Après règlement, l’admin te transmet un code d’activation pour activer ton abonnement.
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          Facturation en dinar tunisien. Ton abonnement est activé après vérification
          du paiement par notre équipe.
        </p>
      </main>
    </div>
  );
}
