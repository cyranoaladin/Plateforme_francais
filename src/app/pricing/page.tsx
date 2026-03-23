'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  KeyRound,
  Landmark,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api/client';
import { track } from '@/components/analytics/events';

type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'PRO';
type PaymentStatus = 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'ERROR';
type BillingStatusPayload = {
  authenticated?: boolean;
  subscription: {
    planId: SubscriptionPlan;
    plan: string;
    label: string;
    status: string;
    currentPeriodEnd: string | null;
  };
  lastPayment: {
    orderRef: string;
    plan: SubscriptionPlan;
    status: PaymentStatus;
    amountMillimes: number;
    currency: string;
    createdAt: string;
  } | null;
};

type PlanCard = {
  id: SubscriptionPlan;
  title: string;
  priceTND: string;
  period: string;
  bullets: string[];
  cta: string;
  ctaDisabledLabel: string;
  checkoutPlan?: string;
  highlighted: boolean;
  kicker: string;
  note: string;
};

const WHATSAPP_NUMBER = '+216 99 19 28 29';
const WHATSAPP_LINK = 'https://wa.me/21699192829';
const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  FREE: 'Freemium',
  PREMIUM: 'Premium',
  PRO: 'Masterium',
};

const BANK_TRANSFER_ROWS = [
  { label: 'Identifiant', value: '871456' },
  { label: 'Titulaire', value: 'STE M&M ACADEMY SUARL' },
  { label: 'Nature du compte', value: 'COMPTES CHEQUES ENTREPRISES' },
  { label: 'RIB', value: 'RIB25079000000156908404' },
  { label: 'IBAN', value: 'TN5925079000000156908404' },
  { label: 'BIC', value: 'BZITTNTT' },
] as const;

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const PLANS: PlanCard[] = [
  {
    id: 'FREE',
    title: 'Freemium',
    priceTND: '0 TND',
    period: '',
    bullets: [
      '1 session orale / mois',
      '2 corrections écrites / mois',
      '3 échanges guidés / jour',
      'Échantillon de bibliothèque',
    ],
    cta: 'Essayer gratuitement',
    ctaDisabledLabel: 'Plan actuel',
    highlighted: false,
    kicker: 'Teste la méthode gratuitement.',
    note: 'Accès limité pour découvrir les ateliers et la méthode. Idéal pour tester avant de t’engager.',
  },
  {
    id: 'PREMIUM',
    title: 'Premium',
    priceTND: '99 TND',
    period: '/ mois',
    bullets: [
      '10 sessions orales / semaine',
      '20 corrections écrites / mois',
      '100 échanges guidés / jour',
      'Analyse de copies : 20 / mois',
      'Parcours personnalisé',
      'Rapport PDF oral',
      'Bibliothèque complète',
    ],
    cta: 'Passer à Premium',
    ctaDisabledLabel: 'Plan actuel',
    checkoutPlan: 'PREMIUM',
    highlighted: true,
    kicker: 'La préparation complète pour réussir ton EAF.',
    note: 'Le meilleur point d\u2019équilibre quand tu travailles chaque semaine et que tu veux supprimer les plafonds trop vite atteints.',
  },
  {
    id: 'PRO',
    title: 'Masterium',
    priceTND: '129 TND',
    period: '/ mois',
    bullets: [
      'Oral illimité',
      'Corrections écrites illimitées',
      'Accompagnement guidé illimité',
      'Analyse de copies : 50 / mois',
      'Volume de travail illimité',
      'Recherche avancée dans le corpus',
      'Historique oral complet',
      'Support prioritaire',
    ],
    cta: 'Passer à Masterium',
    ctaDisabledLabel: 'Plan actuel',
    checkoutPlan: 'PRO',
    highlighted: false,
    kicker: "Pour viser la mention et travailler sans limite.",
    note: 'Aucune limite sur les quotas. Pour ceux qui travaillent intensément et veulent une préparation maximale.',
  },
];

const FEATURE_ROWS: Array<{ label: string; free: string; premium: string; pro: string }> = [
  { label: 'Sessions orales / mois', free: '1', premium: '10 / semaine', pro: 'Illimité' },
  { label: 'Corrections écrites / mois', free: '2', premium: '20', pro: 'Illimité' },
  { label: 'Échanges guidés / jour', free: '3', premium: '100', pro: 'Illimité' },
  { label: 'Analyse de copies / mois', free: '—', premium: '20', pro: '50' },
  { label: 'Volume de travail quotidien', free: 'Limité', premium: 'Élevé', pro: 'Illimité' },
  { label: 'Rapport PDF oral', free: '—', premium: 'Oui', pro: 'Oui' },
  { label: 'Recherche avancée corpus', free: '—', premium: '—', pro: 'Oui' },
  { label: 'Support', free: 'FAQ', premium: 'Email', pro: 'Prioritaire' },
];

const BILLING_FAQ = [
  {
    q: "Que se passe-t-il si j’atteins un quota\u00A0?",
    a: "La plateforme bloque l’action concernée, conserve ton travail et t’indique le plan utile pour reprendre sans repartir de zéro.",
  },
  {
    q: 'Puis-je changer de plan ?',
    a: 'Oui, à tout moment. Compare les offres sur cette page et choisis le plan adapté à ton rythme de travail.',
  },
  {
    q: 'Comment fonctionne le paiement ?',
    a: 'Les abonnements payants sont activés par virement bancaire ou via WhatsApp (+216 99 19 28 29). Tu reçois un code d\u2019activation après confirmation du règlement.',
  },
  {
    q: 'Comment recevoir mon code d\u2019activation\u00A0?',
    a: 'Effectue un virement bancaire avec l\u2019email de ton compte en référence, ou contacte-nous via WhatsApp au +216 99 19 28 29. Le code est envoyé après vérification du règlement.',
  },
];

const DECISION_GUIDES = [
  {
    title: 'Freemium',
    body: 'Un aperçu pour juger la qualité du produit avant de s\u2019engager. Les quotas restent volontairement limités.',
  },
  {
    title: 'Premium — 99 TND/mois',
    body: 'Le bon rythme pour progresser chaque semaine : quotas larges, parcours personnalisé et bibliothèque complète.',
  },
  {
    title: 'Masterium — 129 TND/mois',
    body: 'Zéro plafond sur l\u2019oral, l\u2019écrit et le quiz. Conçu pour une préparation intensive sans compromis.',
  },
];

function BillingFaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/85 shadow-[var(--shadow-md)]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[var(--c-primary)] md:text-base">{q}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
        )}
      </button>
      {open ? <div className="px-5 pb-5 text-sm leading-7 text-[var(--text-secondary)]">{a}</div> : null}
    </div>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const [codeInput, setCodeInput] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeSuccess, setCodeSuccess] = useState<{ plan: string; endsAt: string; message: string } | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    track({ name: 'page_view', props: { path: '/pricing' } });

    const load = async () => {
      try {
        const payload = await apiFetch<BillingStatusPayload>('/api/v1/billing/status', {
          redirectOnUnauthorized: false,
        });
        setBilling(payload);
        setIsAuthenticated(payload.authenticated ?? true);
      } catch (err) {
        if (isApiError(err) && err.status === 401) {
          setBilling(null);
          setIsAuthenticated(false);
          setError(null);
        } else if (isApiError(err)) {
          setError(err.message);
        } else {
          setError('Impossible de charger ton statut de facturation.');
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const currentPlan = billing?.subscription.planId ?? 'FREE';
  const currentPlanLabel = PLAN_LABELS[currentPlan] ?? currentPlan;
  const currentPeriodEndLabel = useMemo(() => {
    const value = billing?.subscription.currentPeriodEnd;
    if (!value) return null;
    return new Date(value).toLocaleDateString('fr-FR');
  }, [billing?.subscription.currentPeriodEnd]);

  const lastPaymentLabel = useMemo(() => {
    if (!billing?.lastPayment) return null;
    return `${(billing.lastPayment.amountMillimes / 1000).toFixed(3)} ${billing.lastPayment.currency}`;
  }, [billing?.lastPayment]);

  const redeemCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!codeInput.trim() || codeLoading) return;

    setCodeError(null);
    setCodeSuccess(null);
    setCodeLoading(true);
    track({ name: 'pricing_code_redeem_attempt', props: { plan: 'unknown' } });

    try {
      const res = await apiFetch<{ plan: string; endsAt: string; message: string }>('/api/v1/billing/redeem-code', {
        method: 'POST',
        json: { code: codeInput.trim() },
      });
      setCodeSuccess(res);
      setCodeInput('');
      track({ name: 'pricing_code_redeem_success', props: { plan: res.plan } });

      try {
        const updated = await apiFetch<BillingStatusPayload>('/api/v1/billing/status');
        setBilling(updated);
      } catch {
        // noop
      }
    } catch (err) {
      if (isApiError(err)) {
        setCodeError(err.status === 429 ? `Trop de tentatives. Réessaie dans ${err.retryAfterSec ?? 60}s.` : err.message);
      } else {
        setCodeError('Erreur inattendue. Vérifie ta connexion.');
      }
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--bg-surface-secondary)] text-[var(--text-heading)] [background-image:radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(184,115,51,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,239,229,1))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_center_top,rgba(255,255,255,0.9),transparent_65%)]" />
      <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full bg-[var(--c-success)]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-[38rem] h-72 w-72 rounded-full bg-[var(--color-amber-300)]/10 blur-3xl" />

      <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24">
        <header className="flex flex-col gap-5 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/80 px-5 py-4 shadow-[var(--shadow-md)] sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-4">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-11 w-auto object-contain" />
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--c-primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--c-success)]" />
              Plans 2026
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--text-secondary)]">
            <Link href="/" className="rounded-full px-4 py-2 transition-colors hover:text-[var(--c-primary)]">
              Retour accueil
            </Link>
            <Link href="/login" className="rounded-full px-4 py-2 transition-colors hover:text-[var(--c-primary)]">
              Se connecter
            </Link>
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--c-primary)] px-5 py-2.5 text-[var(--bg-page)] transition-all hover:-translate-y-0.5 hover:bg-[var(--c-primary-active)]"
            >
              Comparer les plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-8 pb-12 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)]/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--c-primary)] shadow-sm">
              <BadgeCheck className="h-4 w-4 text-[var(--c-success)]" />
              Tarification claire, sans promesse floue
            </div>

            <h1
              style={EDITORIAL_HEADING}
              className="mt-7 max-w-4xl text-4xl leading-[0.96] tracking-[-0.04em] text-[var(--c-primary)] sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Choisis le bon rythme de travail,
              <span className="block text-[var(--c-success)]">puis laisse le produit faire le reste.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-body)] sm:text-xl">
              Compare les plans, comprends les quotas, vois les alternatives de paiement et décide seulement après avoir compris ce que chaque niveau débloque vraiment.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href="#plans"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--c-primary)] px-6 py-3.5 text-base font-bold text-[var(--bg-page)] transition-all hover:-translate-y-0.5 hover:bg-[var(--c-primary-active)]"
              >
                Choisir mon offre
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/login?mode=register"
                className="inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)]/85 px-6 py-3.5 text-base font-semibold text-[var(--c-primary)] transition-colors hover:bg-[var(--bg-surface)]"
              >
                Essayer gratuitement
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {['Aucun paiement avant essai', 'Virement bancaire actif', 'WhatsApp actif'].map((item) => (
                <span key={item} className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)]/75 px-3.5 py-1.5 text-xs font-semibold text-[var(--text-body)]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <aside className="rounded-[24px] border border-white/10 bg-[var(--c-primary)] p-6 text-[var(--bg-page)] shadow-[var(--shadow-md)] md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--border-warm)]">Ton statut</p>
                <h2 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-white">
                  Une facturation lisible, même avant paiement.
                </h2>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[var(--bg-page)]">
                Facturation en TND
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-200">
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement du statut...
                  </div>
                ) : !isAuthenticated ? (
                  <div className="space-y-3 text-sm text-slate-200">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Mode visiteur</p>
                      <p className="mt-1 text-lg font-bold text-white">Aucun compte connecté</p>
                    </div>
                    <p className="leading-6 text-slate-200">
                      Tu peux comparer les plans librement. Le compte gratuit n’intervient qu’au moment utile, pas avant.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-slate-200">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Plan actif</p>
                      <p className="mt-1 text-lg font-bold text-white">{currentPlanLabel}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Statut</p>
                      <p className="mt-1 font-semibold text-white">{{ ACTIVE: 'Actif', CANCELLED: 'Annulé', PAST_DUE: 'Échéance dépassée', TRIALING: 'Essai' }[billing?.subscription.status ?? 'ACTIVE'] ?? billing?.subscription.status}</p>
                    </div>
                    {currentPeriodEndLabel ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Échéance</p>
                        <p className="mt-1 font-semibold text-white">{currentPeriodEndLabel}</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Dernier paiement</p>
                {!isAuthenticated ? (
                  <div className="mt-3 space-y-2 text-sm text-slate-200">
                    <p className="font-semibold text-white">Aucun paiement requis pour commencer</p>
                    <p>Le plan Freemium permet déjà de configurer ton parcours, de tester les premiers ateliers et de découvrir la méthode.</p>
                  </div>
                ) : billing?.lastPayment ? (
                  <div className="mt-3 space-y-2 text-sm text-slate-200">
                    <p className="font-semibold text-white">{{ PENDING: 'En attente', ACCEPTED: 'Accepté', REFUSED: 'Refusé', ERROR: 'Erreur' }[billing.lastPayment.status] ?? billing.lastPayment.status}</p>
                    <p>{lastPaymentLabel}</p>
                    <p className="text-xs text-slate-400">
                      {PLAN_LABELS[billing.lastPayment.plan] ?? billing.lastPayment.plan} · Ref. {billing.lastPayment.orderRef}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-200">Aucun paiement récent enregistré.</p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[24px] bg-[var(--bg-surface-secondary)] p-4 text-[var(--c-primary)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Devise et moyens de paiement</p>
                  <p className="mt-1 text-sm font-semibold">Facturation en TND. Virement bancaire et WhatsApp actifs.</p>
                </div>
                <div className="rounded-full bg-[var(--c-primary)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--bg-page)]">
                  TND
                </div>
              </div>
            </div>
          </aside>
        </section>

        {error ? (
          <div className="mb-8 flex items-start gap-3 rounded-[24px] border border-[var(--error-muted)]/25 bg-[var(--c-accent-subtle)] p-4 text-sm text-[var(--error-dark)]" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <section id="plans" className="scroll-mt-24 pb-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Plans</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
                Trois rythmes, trois plafonds, une seule logique de valeur.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              Le but n’est pas de noyer l’offre. Il est de rendre le choix simple, défendable et rapide pour l’élève comme pour le parent qui paie.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = isAuthenticated && plan.id === currentPlan;
              const accent = plan.highlighted
                ? 'border-[var(--c-primary)] bg-[var(--c-primary)] text-[var(--bg-page)] shadow-[var(--shadow-md)]'
                : isCurrent
                  ? 'border-[var(--c-success)] bg-[var(--bg-surface-secondary)] text-[var(--c-primary)]'
                  : 'border-[var(--border-strong)] bg-[var(--bg-surface)]/85 text-[var(--c-primary)]';

              return (
                <article key={plan.id} className={`${accent} rounded-[24px] border p-6`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.26em] opacity-70">{plan.kicker}</p>
                      <h3 style={EDITORIAL_HEADING} className="mt-3 text-4xl tracking-[-0.03em]">
                        {plan.title}
                      </h3>
                    </div>
                    {plan.highlighted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                        <Sparkles className="h-3.5 w-3.5" />
                        Recommandé
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-4xl font-bold">{plan.priceTND}</span>
                    {plan.period ? <span className="pb-1 text-sm opacity-75">{plan.period}</span> : null}
                  </div>

                  <p className={`mt-3 text-sm leading-7 ${plan.highlighted ? 'text-slate-200' : 'text-[var(--text-secondary)]'}`}>
                    {plan.note}
                  </p>

                  <ul className="mt-6 space-y-3 text-sm leading-6">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <CheckCircle2 className={`mt-1 h-4 w-4 shrink-0 ${plan.highlighted ? 'text-[var(--border-warm)]' : 'text-[var(--c-success)]'}`} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={(isAuthenticated && isCurrent) || (isAuthenticated && !plan.checkoutPlan)}
                    onClick={() => {
                      if (!plan.checkoutPlan) {
                        if (!isAuthenticated) {
                          window.location.assign('/login?mode=register');
                        }
                        return;
                      }
                      track({ name: 'pricing_plan_select', props: { plan: plan.id } });
                      // Go live: virement/espèces → WhatsApp
                      const msg = encodeURIComponent(`Bonjour, je souhaite activer le plan ${plan.title} (${plan.priceTND} ${plan.period}). Merci de m'envoyer les instructions de paiement.`);
                      window.open(`https://wa.me/21699192829?text=${msg}`, '_blank');
                    }}
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      plan.highlighted
                        ? 'bg-[var(--bg-page)] text-[var(--c-primary)] hover:-translate-y-0.5 hover:bg-white'
                        : 'bg-[var(--c-primary)] text-[var(--bg-page)] hover:-translate-y-0.5 hover:bg-[var(--c-primary-active)]'
                    }`}
                  >
                    {!isAuthenticated ? (
                      plan.id === 'FREE' ? 'Essayer gratuitement' : 'Choisir ce plan'
                    ) : isCurrent ? (
                      plan.ctaDisabledLabel
                    ) : (
                      plan.cta
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="pb-16">
          <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/80 p-6 shadow-[var(--shadow-md)] md:p-8">
            <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Aide à la décision</p>
                <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
                  La bonne offre dépend du rythme, pas d’un argument marketing vide.
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {DECISION_GUIDES.map((guide) => (
                  <article key={guide.title} className="rounded-[26px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--c-primary)]">{guide.title}</p>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{guide.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 pb-16 lg:grid-cols-2">
          <article className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/85 p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--c-primary)] text-[var(--bg-page)]">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Activation</p>
                <h2 style={EDITORIAL_HEADING} className="mt-1 text-3xl leading-tight tracking-[-0.03em] text-[var(--c-primary)]">
                  Activer avec un code
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              Si un code d'activation t'a été envoyé, active ton plan directement ici.
            </p>

            {isAuthenticated ? (
              <form onSubmit={redeemCode} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="EAF-XXXX-XXXX-XXXX"
                  className="flex-1 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-sm font-mono tracking-wider text-[var(--c-primary)] outline-none transition focus:border-[var(--c-success)] focus:ring-2 focus:ring-[var(--c-success)]/20"
                  maxLength={25}
                  disabled={codeLoading}
                />
                <button
                  type="submit"
                  disabled={codeLoading || !codeInput.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--c-primary)] px-5 py-3 text-sm font-bold text-[var(--bg-page)] transition-colors hover:bg-[var(--c-primary-active)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {codeLoading ? 'Activation...' : 'Activer'}
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 text-sm leading-7 text-[var(--text-secondary)]">
                <Link href="/login" className="font-semibold text-[var(--c-primary)] underline">Connecte-toi d’abord</Link> pour rattacher le code à ton compte, puis reviens ici pour l’activer.
              </div>
            )}

            {codeSuccess ? (
              <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-[var(--border-success)] bg-[var(--bg-success)] p-4 text-sm text-[var(--text-success-on-subtle)]" role="status">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{codeSuccess.message}</span>
              </div>
            ) : null}
            {codeError ? (
              <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-[var(--error-muted)]/25 bg-[var(--c-accent-subtle)] p-4 text-sm text-[var(--error-dark)]" role="alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{codeError}</span>
              </div>
            ) : null}
          </article>

          <article className="rounded-[24px] border border-[var(--c-primary)] bg-[var(--c-primary)] p-6 text-[var(--bg-page)] shadow-[var(--shadow-md)] md:p-7">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[var(--color-slate-300)]">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--border-warm)]">Paiement alternatif</p>
                <h2 style={EDITORIAL_HEADING} className="mt-1 text-3xl leading-tight tracking-[-0.03em] text-white">
                  Commander un code en Tunisie
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-200">
              Pour l'instant, les abonnements payants s'activent par virement bancaire ou via WhatsApp.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--border-warm)]" />
                  <div>
                    <p className="text-sm font-semibold text-white">Modes de paiement actifs</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Les abonnements s'activent par virement bancaire ou via WhatsApp. Ajoute l'email du compte ou ton identifiant utilisateur en référence pour accélérer l'activation.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <div className="flex items-start gap-3">
                  <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-[var(--border-warm)]" />
                  <div>
                    <p className="text-sm font-semibold text-white">Virement bancaire</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">Ajoute l’email du compte ou l’identifiant utilisateur en motif. Le plan est activé après vérification du règlement.</p>
                    <div className="mt-4 grid gap-2 rounded-[16px] bg-[var(--c-primary-active)] p-4 text-sm text-slate-100 sm:grid-cols-2">
                      {BANK_TRANSFER_ROWS.map((row) => (
                        <div key={row.label} className={row.label === 'Titulaire' ? 'sm:col-span-2' : ''}>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--border-warm)]">{row.label}</p>
                          <p className="mt-1 break-all font-semibold text-white">{row.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href="/contact?subject=virement"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--c-primary)] transition hover:bg-[var(--bg-surface-secondary)]"
                      >
                        Envoyer la référence
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] bg-[var(--c-primary-active)] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--border-warm)]" />
                <p className="text-sm leading-6 text-slate-200">
                  Facturation en dinar tunisien. Premium = 99 TND/mois. Masterium = 129 TND/mois. Le code d’activation est envoyé après confirmation du virement bancaire ou via WhatsApp.
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="pb-16">
          <div className="rounded-[24px] border-2 border-[var(--whatsapp)] bg-[var(--bg-surface)]/90 p-6 shadow-[var(--shadow-md)] md:p-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--whatsapp)] text-white">
                <MessageCircle className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--whatsapp)]">Canal actif</p>
                <h2 style={EDITORIAL_HEADING} className="mt-1 text-3xl leading-tight tracking-[-0.03em] text-[var(--c-primary)]">
                  Souscrire via WhatsApp
                </h2>
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-body)]">
              Tu préfères être accompagné directement ? Envoie-nous un message WhatsApp pour choisir ton plan, poser tes questions et recevoir ton code d’activation.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Numéro WhatsApp</p>
                <p className="mt-2 text-2xl font-bold tracking-wide text-[var(--c-primary)]">{WHATSAPP_NUMBER}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                  Disponible pour répondre à tes questions sur les plans, t’aider à choisir et finaliser ton abonnement.
                </p>
              </div>
              <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Comment ça marche</p>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-body)]">
                  <li className="flex items-start gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--whatsapp)] text-[10px] font-bold text-white">1</span>Envoie &quot;Bonjour&quot; sur WhatsApp</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--whatsapp)] text-[10px] font-bold text-white">2</span>Choisis ton plan (Premium ou Masterium)</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--whatsapp)] text-[10px] font-bold text-white">3</span>Reçois ton code d’activation</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--whatsapp)] px-7 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--whatsapp-hover)] hover:shadow-lg"
              >
                <MessageCircle className="h-5 w-5" />
                Ouvrir WhatsApp
              </a>
              <a
                href={`https://wa.me/21699192829?text=${encodeURIComponent('Bonjour, je souhaite souscrire à un abonnement Nexus Réussite.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--whatsapp)] bg-[var(--bg-surface)] px-7 py-3.5 text-base font-semibold text-[var(--whatsapp)] transition-all hover:-translate-y-0.5 hover:bg-[var(--success-bg-pale)]"
              >
                Envoyer un message pré-rempli
              </a>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-[16px] bg-[var(--success-bg-pale)] p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--whatsapp)]" />
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                Ce numéro est géré par l’équipe Nexus Réussite. Aucun paiement n’est demandé via WhatsApp — le règlement se fait exclusivement par virement bancaire.
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Comparaison détaillée</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
                Les quotas sont visibles, donc la décision reste rationnelle.
              </h2>
            </div>
            <div className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)]/80 px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
              <Clock3 className="mr-2 inline h-4 w-4 text-[var(--c-success)]" />
              Compare en 30 secondes
            </div>
          </div>

          <div className="mt-10 overflow-x-auto rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/85 shadow-[var(--shadow-md)]">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-[var(--bg-surface-secondary)] text-left">
                  <th className="px-5 py-4 font-bold text-[var(--c-primary)]">Fonctionnalité</th>
                  <th className="px-5 py-4 text-center font-bold text-[var(--c-primary)]">Freemium</th>
                  <th className="px-5 py-4 text-center font-bold text-[var(--c-success)]">Premium</th>
                  <th className="px-5 py-4 text-center font-bold text-[var(--c-primary)]">Masterium</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row, index) => (
                  <tr key={row.label} className={index % 2 === 0 ? 'bg-[var(--bg-surface)]' : 'bg-[var(--bg-surface-secondary)]'}>
                    <td className="px-5 py-3.5 font-medium text-[var(--c-primary)]">{row.label}</td>
                    <td className="px-5 py-3.5 text-center text-[var(--text-secondary)]">{row.free}</td>
                    <td className="px-5 py-3.5 text-center text-[var(--text-secondary)]">{row.premium}</td>
                    <td className="px-5 py-3.5 text-center text-[var(--text-secondary)]">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 pb-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">FAQ facturation</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
              Les questions d’argent doivent être traitées aussi clairement que le reste.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)]">
              Si la page est bonne, elle coupe court aux hésitations inutiles : quotas, changement de plan, paiement et alternatives sont lisibles sans jargon.
            </p>

            <div className="mt-8 rounded-[24px] border border-[var(--c-primary)] bg-[var(--c-primary)] p-6 text-[var(--bg-page)] shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--border-warm)]">Prêt à passer à l’action ?</p>
              <h3 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-white">
                La préparation sérieuse commence avec Premium.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                Le plan Freemium donne un aperçu de la méthode de travail. Premium débloque le rythme nécessaire pour progresser réellement avant l'épreuve.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/login?mode=register" className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--bg-page)] px-5 py-3 text-sm font-bold text-[var(--c-primary)] transition-all hover:-translate-y-0.5 hover:bg-white">
                  Comparer les plans
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/" className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-[var(--bg-page)] transition-colors hover:bg-white/6">
                  Retour à l’accueil
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {BILLING_FAQ.map((item) => (
              <BillingFaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
