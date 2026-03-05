'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, KeyRound, Loader2, Phone, Sparkles, Landmark, AlertTriangle } from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api/client';
import { track } from '@/components/analytics/events';

/* ─────────────────── Types ─────────────────── */

type SubscriptionPlan = 'FREE' | 'MONTHLY' | 'LIFETIME';
type PaymentStatus = 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'ERROR';
type ClicToPayPlan = 'MONTHLY' | 'LIFETIME';
type Currency = 'TND' | 'EUR';

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

/* ─────────────────── Plan data ─────────────────── */

type PlanCard = {
  id: SubscriptionPlan;
  title: string;
  priceTND: string;
  priceEUR: string;
  period: string;
  bullets: string[];
  cta: string;
  ctaDisabledLabel: string;
  clicToPayPlan?: ClicToPayPlan;
  highlighted: boolean;
};

const PLANS: PlanCard[] = [
  {
    id: 'FREE',
    title: 'Free',
    priceTND: '0 TND',
    priceEUR: '0 €',
    period: '',
    bullets: [
      '2 sessions orales / semaine',
      '3 épreuves écrites / mois',
      '10 questions tuteur / jour',
      'Bibliothèque complète',
    ],
    cta: 'Garder Free',
    ctaDisabledLabel: 'Plan actuel',
    highlighted: false,
  },
  {
    id: 'MONTHLY',
    title: 'Pro',
    priceTND: '24,9 TND',
    priceEUR: '9,90 €',
    period: '/ mois',
    bullets: [
      '10 sessions orales / semaine',
      '20 épreuves écrites / mois',
      '100 questions tuteur / jour',
      'OCR 20 copies / mois',
      'Parcours personnalisé',
      'Rapport PDF oral',
    ],
    cta: 'Passer à Pro',
    ctaDisabledLabel: 'Plan actuel',
    clicToPayPlan: 'MONTHLY',
    highlighted: true,
  },
  {
    id: 'LIFETIME',
    title: 'Max',
    priceTND: '44,9 TND',
    priceEUR: '19,90 €',
    period: '/ mois',
    bullets: [
      'Oral illimité',
      'Écrit illimité',
      'Tuteur illimité',
      'OCR 50 copies / mois',
      'Tokens 200k / jour',
      'Spaced repetition',
      'Support prioritaire',
    ],
    cta: 'Passer à Max',
    ctaDisabledLabel: 'Plan actuel',
    clicToPayPlan: 'LIFETIME',
    highlighted: false,
  },
];

/* ─────────────────── Feature matrix ─────────────────── */

const FEATURE_ROWS: Array<{ label: string; free: string; pro: string; max: string }> = [
  { label: 'Sessions orales / semaine', free: '2', pro: '10', max: 'Illimité' },
  { label: 'Épreuves écrites / mois', free: '3', pro: '20', max: 'Illimité' },
  { label: 'RAG / questions tuteur / jour', free: '10', pro: '100', max: 'Illimité' },
  { label: 'OCR copies / mois', free: '—', pro: '20', max: '50' },
  { label: 'Tokens LLM / jour', free: '10k', pro: '50k', max: '200k' },
  { label: 'Rapport PDF oral', free: '—', pro: '✓', max: '✓' },
  { label: 'Spaced repetition', free: '—', pro: '—', max: '✓' },
  { label: 'Support', free: 'FAQ', pro: 'Email', max: 'Prioritaire' },
];

/* ─────────────────── Billing FAQ ─────────────────── */

const BILLING_FAQ = [
  {
    q: 'Que se passe-t-il si j\'atteins un quota ?',
    a: 'L\'action est bloquée et la plateforme propose le plan adapté. Aucune donnée n\'est perdue.',
  },
  {
    q: 'Puis-je changer de plan ?',
    a: 'Oui, à tout moment depuis cette page. Le changement prend effet immédiatement.',
  },
  {
    q: 'Comment fonctionne le paiement ?',
    a: 'Paiement sécurisé via ClicToPay (cartes nationales et internationales, CVV2 et 3D Secure). Confirmation sur /paiement/confirmation, échec sur /paiement/refus.',
  },
  {
    q: 'Moyens de paiement acceptés ?',
    a: 'Carte bancaire locale, D17 / e-Dinar (Poste Tunisienne) selon disponibilité. Facturation mensuelle, résiliable à tout moment.',
  },
];

function BillingFaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-foreground text-sm pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">{a}</div>}
    </div>
  );
}

/* ─────────────────── Page ─────────────────── */

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPlan, setPendingPlan] = useState<ClicToPayPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('TND');

  // Activation code state
  const [codeInput, setCodeInput] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeSuccess, setCodeSuccess] = useState<{ plan: string; endsAt: string; message: string } | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    track({ name: 'page_view', props: { path: '/pricing' } });

    const load = async () => {
      try {
        const payload = await apiFetch<BillingStatusPayload>('/api/payments/clictopay/status');
        setBilling(payload);
      } catch (err) {
        if (isApiError(err)) {
          setError(err.message);
        } else {
          setError('Impossible de charger votre statut de facturation.');
        }
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

  const startCheckout = async (plan: ClicToPayPlan, planId: string) => {
    setError(null);
    setPendingPlan(plan);
    track({ name: 'pricing_checkout_click', props: { plan: planId } });

    try {
      const payload = await apiFetch<{ checkoutUrl?: string }>('/api/payments/clictopay/init', {
        method: 'POST',
        json: { plan },
      });

      if (!payload.checkoutUrl) {
        throw { status: 500, message: 'URL de paiement introuvable.' } as const;
      }

      window.location.assign(payload.checkoutUrl);
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError('Paiement indisponible. Réessaie dans quelques minutes.');
      }
      setPendingPlan(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ─── Header ─── */}
      <header className="mb-10 space-y-3">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Plans et quotas</h1>
        <p className="text-muted-foreground text-base leading-7 max-w-xl">
          Choisis un plan adapté à ton rythme. Les quotas évitent les abus et garantissent une expérience stable.
        </p>

        {/* Currency toggle */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-xs text-muted-foreground">Devise :</span>
          <div className="flex p-0.5 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setCurrency('TND')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${currency === 'TND' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              TND
            </button>
            <button
              type="button"
              onClick={() => setCurrency('EUR')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${currency === 'EUR' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              EUR
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground">Les prix peuvent varier selon la devise.</span>
        </div>
      </header>

      {/* ─── Current plan status ─── */}
      <section className="mb-8 rounded-xl border border-border bg-card p-5">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement de votre abonnement…
          </div>
        )}
        {!loading && (
          <div className="space-y-1 text-sm">
            <p>Plan actif : <strong>{currentPlan}</strong></p>
            <p>Statut : <strong>{billing?.subscription.status ?? 'ACTIVE'}</strong></p>
            {currentPeriodEndLabel && <p>Échéance : <strong>{currentPeriodEndLabel}</strong></p>}
            {billing?.lastPayment && (
              <p>Dernier paiement : <strong>{billing.lastPayment.status}</strong> ({(billing.lastPayment.amountMillimes / 1000).toFixed(3)} TND)</p>
            )}
          </div>
        )}
      </section>

      {/* ─── Plan Cards ─── */}
      <section className="grid gap-6 md:grid-cols-3 mb-12">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isLoadingPlan = pendingPlan !== null && plan.clicToPayPlan === pendingPlan;
          const price = currency === 'TND' ? plan.priceTND : plan.priceEUR;

          return (
            <article
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col transition hover:shadow-lg ${
                plan.highlighted
                  ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 shadow-lg shadow-violet-600/10 ring-2 ring-violet-500/20'
                  : isCurrent
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
              }`}
            >
              {plan.highlighted && (
                <span className="inline-flex self-start items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-violet-600 text-white mb-3">
                  <Sparkles className="w-3 h-3" /> Populaire
                </span>
              )}
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{plan.title}</p>
              <div className="mt-2">
                <span className="text-3xl font-bold text-foreground">{price}</span>
                {plan.period && <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>}
              </div>

              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {bullet}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isCurrent || !plan.clicToPayPlan || pendingPlan !== null}
                onClick={() => {
                  if (plan.clicToPayPlan) {
                    track({ name: 'pricing_plan_select', props: { plan: plan.id } });
                    void startCheckout(plan.clicToPayPlan, plan.id);
                  }
                }}
                className={`mt-6 w-full rounded-xl py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  plan.highlighted
                    ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-md'
                    : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                }`}
              >
                {isLoadingPlan ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Redirection…</span>
                ) : isCurrent ? (
                  plan.ctaDisabledLabel
                ) : (
                  plan.cta
                )}
              </button>
            </article>
          );
        })}
      </section>

      {/* ─── Bloc A: Activer avec un code ─── */}
      <section className="mb-10 max-w-lg mx-auto">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-bold text-foreground">Activer avec un code</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Tu as reçu un code d&apos;activation ? Saisis-le ci-dessous pour activer ton plan.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!codeInput.trim() || codeLoading) return;
              setCodeError(null);
              setCodeSuccess(null);
              setCodeLoading(true);
              track({ name: 'pricing_code_redeem_attempt', props: { plan: 'unknown' } });
              try {
                const res = await apiFetch<{ plan: string; endsAt: string; message: string }>(
                  '/api/v1/billing/redeem-code',
                  { method: 'POST', json: { code: codeInput.trim() } },
                );
                setCodeSuccess(res);
                setCodeInput('');
                track({ name: 'pricing_code_redeem_success', props: { plan: res.plan } });
                // Refresh billing status
                try {
                  const updated = await apiFetch<BillingStatusPayload>('/api/payments/clictopay/status');
                  setBilling(updated);
                } catch { /* non-blocking */ }
              } catch (err) {
                if (isApiError(err)) {
                  setCodeError(err.message);
                  if (err.status === 429) {
                    setCodeError(`Trop de tentatives. Réessaie dans ${err.retryAfterSec ?? 60}s.`);
                  }
                } else {
                  setCodeError('Erreur inattendue. Vérifie ta connexion.');
                }
              } finally {
                setCodeLoading(false);
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="NEXUS-PRO-XXXX-XXXX"
              className="flex-1 bg-background border border-input rounded-xl px-3 py-2.5 text-sm font-mono tracking-wider focus:ring-2 focus:ring-violet-500 focus:outline-none uppercase"
              maxLength={25}
              disabled={codeLoading}
            />
            <button
              type="submit"
              disabled={codeLoading || !codeInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
            >
              {codeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activer'}
            </button>
          </form>

          {codeSuccess && (
            <div className="mt-3 p-3 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700 text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2" role="status">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{codeSuccess.message}</span>
            </div>
          )}
          {codeError && (
            <div className="mt-3 p-3 rounded-xl border border-error/30 bg-error/10 text-sm text-error flex items-start gap-2" role="alert">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{codeError}</span>
            </div>
          )}
        </div>
      </section>

      {/* ─── Bloc B: Commander un code (Tunisie) ─── */}
      <section className="mb-10 max-w-lg mx-auto">
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Commander un code (Tunisie)</h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Pas de carte bancaire ? Commande un code d&apos;activation et paye à la livraison ou par virement.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Landmark className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Virement bancaire</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Envoie le montant du plan choisi avec ta référence (email ou ID utilisateur) en motif.
                  Le code sera envoyé par email sous 24h ouvrées.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Livraison à domicile (Tunis)</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Commande via WhatsApp ou téléphone. Paiement à la livraison. Délai : 24–48h.
                </p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-4 border-t border-border pt-3">
            Une fois le code reçu, saisis-le dans le champ ci-dessus pour activer ton plan immédiatement.
          </p>
        </div>
      </section>

      {/* ─── Payment micro-copy ─── */}
      <p className="text-center text-xs text-muted-foreground mb-10">
        Paiement en dinar tunisien. Facturation mensuelle, résiliable à tout moment.
        Paiement possible via D17 / e-Dinar (Poste Tunisienne) selon disponibilité.
      </p>

      {error && (
        <p className="mb-8 rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {/* ─── Feature Matrix ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-4">Comparaison détaillée</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-foreground">Fonctionnalité</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">Free</th>
                <th className="text-center px-4 py-3 font-semibold text-violet-600 dark:text-violet-400">Pro</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">Max</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row, idx) => (
                <tr key={row.label} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                  <td className="px-4 py-2.5 text-foreground font-medium">{row.label}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{row.free}</td>
                  <td className="px-4 py-2.5 text-center font-semibold text-foreground">{row.pro}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{row.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Billing FAQ ─── */}
      <section className="max-w-2xl mx-auto mb-10">
        <h2 className="text-xl font-bold text-foreground mb-4 text-center">Questions fréquentes — Facturation</h2>
        <div className="space-y-2">
          {BILLING_FAQ.map((item) => (
            <BillingFaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>
    </main>
  );
}
