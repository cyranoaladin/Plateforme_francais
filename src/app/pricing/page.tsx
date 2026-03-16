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
import { TEMPORARY_PAYMENT_UNAVAILABLE_MESSAGE } from '@/lib/payments/availability';

type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'PRO';
type PaymentStatus = 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'ERROR';
type CheckoutPlan = 'PREMIUM' | 'PRO';

type BillingStatusPayload = {
  subscription: {
    plan: SubscriptionPlan;
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
  checkoutPlan?: CheckoutPlan;
  highlighted: boolean;
  kicker: string;
  note: string;
};

const CONTACT_EMAIL = 'contact@nexusreussite.academy';
const WHATSAPP_NUMBER = '+216 99 19 28 29';
const WHATSAPP_LINK = 'https://wa.me/21699192829';
const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  FREE: 'Free',
  PREMIUM: 'Premium',
  PRO: 'Pro',
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
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

const PLANS: PlanCard[] = [
  {
    id: 'FREE',
    title: 'Free',
    priceTND: '0 TND',
    period: '',
    bullets: [
      '1 session orale / mois',
      '2 corrections écrites / mois',
      '3 échanges guidés / jour',
      'Échantillon de bibliothèque',
    ],
    cta: 'Découvrir gratuitement',
    ctaDisabledLabel: 'Plan actuel',
    highlighted: false,
    kicker: 'Aperçu du produit',
    note: 'Un accès limité pour juger la qualité du workflow avant de s\u2019engager.',
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
      'OCR 20 copies / mois',
      'Parcours personnalisé',
      'Rapport PDF oral',
      'Bibliothèque complète',
    ],
    cta: 'Passer à Premium',
    ctaDisabledLabel: 'Plan actuel',
    checkoutPlan: 'PREMIUM',
    highlighted: true,
    kicker: 'Rythme régulier',
    note: 'Le meilleur point d’équilibre quand tu travailles chaque semaine et que tu veux supprimer les plafonds trop vite atteints.',
  },
  {
    id: 'PRO',
    title: 'Pro',
    priceTND: '129 TND',
    period: '/ mois',
    bullets: [
      'Oral illimité',
      'Corrections écrites illimitées',
      'Accompagnement guidé illimité',
      'OCR 50 copies / mois',
      'Capacité de traitement 200k / jour',
      'Graph RAG avancé',
      'Historique oral complet',
      'Support prioritaire',
    ],
    cta: 'Passer à Pro',
    ctaDisabledLabel: 'Plan actuel',
    checkoutPlan: 'PRO',
    highlighted: false,
    kicker: 'Tout illimité',
    note: 'Conçu pour les usages intensifs et ceux qui veulent zéro limite sur les quotas.',
  },
];

const FEATURE_ROWS: Array<{ label: string; free: string; premium: string; pro: string }> = [
  { label: 'Sessions orales / mois', free: '1', premium: '10 / semaine', pro: 'Illimité' },
  { label: 'Corrections écrites / mois', free: '2', premium: '20', pro: 'Illimité' },
  { label: 'Échanges guidés / jour', free: '3', premium: '100', pro: 'Illimité' },
  { label: 'OCR copies / mois', free: '—', premium: '20', pro: '50' },
  { label: 'Capacité de traitement / jour', free: '5k', premium: '50k', pro: '200k' },
  { label: 'Rapport PDF oral', free: '—', premium: 'Oui', pro: 'Oui' },
  { label: 'Graph RAG', free: '—', premium: '—', pro: 'Oui' },
  { label: 'Support', free: 'FAQ', premium: 'Email', pro: 'Prioritaire' },
];

const BILLING_FAQ = [
  {
    q: 'Que se passe-t-il si j’atteins un quota ?',
    a: 'La plateforme bloque l’action concernée, conserve ton travail et t’indique le plan utile pour reprendre sans repartir de zéro.',
  },
  {
    q: 'Puis-je changer de plan ?',
    a: 'Oui. Cette page sert justement à comparer, monter en puissance au bon moment et relire ton statut de facturation.',
  },
  {
    q: 'Comment fonctionne le paiement ?',
    a: 'Pour le moment, les abonnements payants sont activés par virement bancaire ou via WhatsApp (+216 99 19 28 29). Le paiement carte et Flouci seront réactivés dès que leur implémentation sera finalisée.',
  },
  {
    q: 'Et si je n’ai pas de carte bancaire ?',
    a: 'Le virement bancaire couvre ce cas immédiatement. Tu peux aussi souscrire via WhatsApp au +216 99 19 28 29. Ajoute l\u2019email du compte ou l\u2019identifiant utilisateur en référence pour accélérer l\u2019activation.',
  },
];

const DECISION_GUIDES = [
  {
    title: 'Free',
    body: 'Un aperçu pour juger la qualité du produit avant de s\u2019engager. Les quotas restent volontairement limités.',
  },
  {
    title: 'Premium — 99 TND/mois',
    body: 'Le vrai rythme de travail : assez de volume pour progresser chaque semaine sans tomber sur les limites.',
  },
  {
    title: 'Pro — 129 TND/mois',
    body: 'Zéro plafond sur l\u2019oral, l\u2019écrit et le quiz. Conçu pour une préparation intensive sans compromis.',
  },
];

function BillingFaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[24px] border border-[#d8ccb9] bg-white/85 shadow-[0_14px_35px_rgba(23,50,77,0.05)]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[#17324d] md:text-base">{q}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-slate-500" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />
        )}
      </button>
      {open ? <div className="px-5 pb-5 text-sm leading-7 text-slate-600">{a}</div> : null}
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
        const payload = await apiFetch<BillingStatusPayload>('/api/v1/payments/clictopay/status');
        setBilling(payload);
        setIsAuthenticated(true);
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

  const currentPlan = billing?.subscription.plan ?? 'FREE';
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

  const startCheckout = (_plan: CheckoutPlan, planId: string) => {
    setError(TEMPORARY_PAYMENT_UNAVAILABLE_MESSAGE);
    track({
      name: 'pricing_checkout_click',
      props: {
        plan: isAuthenticated ? planId : `${planId}_guest`,
      },
    });
  };

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
        const updated = await apiFetch<BillingStatusPayload>('/api/v1/payments/clictopay/status');
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
    <div className="min-h-screen overflow-x-clip bg-[#f4efe5] text-slate-900 [background-image:radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(184,115,51,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,239,229,1))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_center_top,rgba(255,255,255,0.9),transparent_65%)]" />
      <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full bg-[#0f766e]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-[38rem] h-72 w-72 rounded-full bg-[#b87333]/10 blur-3xl" />

      <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24">
        <header className="flex flex-col gap-5 rounded-[30px] border border-[#d8ccb9] bg-white/80 px-5 py-4 shadow-[0_16px_45px_rgba(23,50,77,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-4">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-11 w-auto object-contain" />
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[#d8ccb9] bg-[#f8f4ec] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#17324d]">
              <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
              Plans 2026
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
            <Link href="/" className="rounded-full px-4 py-2 transition-colors hover:text-[#17324d]">
              Retour accueil
            </Link>
            <Link href="/login" className="rounded-full px-4 py-2 transition-colors hover:text-[#17324d]">
              Se connecter
            </Link>
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2 rounded-full bg-[#17324d] px-5 py-2.5 text-[#f7f2ea] transition-all hover:-translate-y-0.5 hover:bg-[#0f2740]"
            >
              Comparer les plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-8 pb-12 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cabaa5] bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#17324d] shadow-sm">
              <BadgeCheck className="h-4 w-4 text-[#0f766e]" />
              Tarification claire, sans promesse floue
            </div>

            <h1
              style={EDITORIAL_HEADING}
              className="mt-7 max-w-4xl text-5xl leading-[0.96] tracking-[-0.04em] text-[#17324d] sm:text-6xl lg:text-7xl"
            >
              Choisis le bon rythme de travail,
              <span className="block text-[#0f766e]">puis laisse le produit faire le reste.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
              Compare les plans, comprends les quotas, vois les alternatives de paiement et décide seulement après avoir compris ce que chaque niveau débloque vraiment.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href="#plans"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#17324d] px-6 py-3.5 text-base font-bold text-[#f7f2ea] transition-all hover:-translate-y-0.5 hover:bg-[#0f2740]"
              >
                Choisir mon offre
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/login?mode=register"
                className="inline-flex items-center justify-center rounded-full border border-[#cabaa5] bg-white/85 px-6 py-3.5 text-base font-semibold text-[#17324d] transition-colors hover:bg-white"
              >
                Découvrir gratuitement
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {['Aucun paiement avant essai', 'Virement bancaire actif', 'WhatsApp actif', 'Carte bientôt disponible', 'Flouci bientôt disponible'].map((item) => (
                <span key={item} className="rounded-full border border-[#d8ccb9] bg-white/75 px-3.5 py-1.5 text-xs font-semibold text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <aside className="rounded-[34px] border border-white/10 bg-[#17324d] p-6 text-[#f7f2ea] shadow-[0_32px_90px_rgba(23,50,77,0.24)] md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">Ton statut</p>
                <h2 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-white">
                  Une facturation lisible, même avant paiement.
                </h2>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#f7f2ea]">
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
                      <p className="mt-1 font-semibold text-white">{billing?.subscription.status ?? 'ACTIVE'}</p>
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
                    <p>Le plan Free permet déjà de tester l’onboarding, les premiers ateliers et la logique du produit.</p>
                  </div>
                ) : billing?.lastPayment ? (
                  <div className="mt-3 space-y-2 text-sm text-slate-200">
                    <p className="font-semibold text-white">{billing.lastPayment.status}</p>
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

            <div className="mt-4 rounded-[24px] bg-[#f4efe5] p-4 text-[#17324d]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Devise et moyens de paiement</p>
                  <p className="mt-1 text-sm font-semibold">Facturation en TND. Virement bancaire et WhatsApp actifs. Paiement carte et Flouci bientôt disponibles.</p>
                </div>
                <div className="rounded-full bg-[#17324d] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f7f2ea]">
                  TND
                </div>
              </div>
            </div>
          </aside>
        </section>

        {error ? (
          <div className="mb-8 flex items-start gap-3 rounded-[24px] border border-[#b65050]/25 bg-[#fff0ef] p-4 text-sm text-[#8f2d2d]" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <section id="plans" className="scroll-mt-24 pb-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Plans</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl">
                Trois rythmes, trois plafonds, une seule logique de valeur.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Le but n’est pas de noyer l’offre. Il est de rendre le choix simple, défendable et rapide pour l’élève comme pour le parent qui paie.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = isAuthenticated && plan.id === currentPlan;
              const accent = plan.highlighted
                ? 'border-[#17324d] bg-[#17324d] text-[#f7f2ea] shadow-[0_24px_70px_rgba(23,50,77,0.18)]'
                : isCurrent
                  ? 'border-[#0f766e] bg-[#f8f4ec] text-[#17324d]'
                  : 'border-[#d8ccb9] bg-white/85 text-[#17324d]';

              return (
                <article key={plan.id} className={`${accent} rounded-[32px] border p-6`}>
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

                  <p className={`mt-3 text-sm leading-7 ${plan.highlighted ? 'text-slate-200' : 'text-slate-600'}`}>
                    {plan.note}
                  </p>

                  <ul className="mt-6 space-y-3 text-sm leading-6">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <CheckCircle2 className={`mt-1 h-4 w-4 shrink-0 ${plan.highlighted ? 'text-[#d7c4aa]' : 'text-[#0f766e]'}`} />
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
                      startCheckout(plan.checkoutPlan, plan.id);
                    }}
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      plan.highlighted
                        ? 'bg-[#f7f2ea] text-[#17324d] hover:-translate-y-0.5 hover:bg-white'
                        : 'bg-[#17324d] text-[#f7f2ea] hover:-translate-y-0.5 hover:bg-[#0f2740]'
                    }`}
                  >
                    {!isAuthenticated ? (
                      plan.id === 'FREE' ? 'Découvrir gratuitement' : 'Choisir ce plan'
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
          <div className="rounded-[34px] border border-[#d8ccb9] bg-white/80 p-6 shadow-[0_18px_45px_rgba(23,50,77,0.06)] md:p-8">
            <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Aide à la décision</p>
                <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl">
                  La bonne offre dépend du rythme, pas d’un argument marketing vide.
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {DECISION_GUIDES.map((guide) => (
                  <article key={guide.title} className="rounded-[26px] border border-[#d8ccb9] bg-[#f8f4ec] p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#17324d]">{guide.title}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{guide.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 pb-16 lg:grid-cols-2">
          <article className="rounded-[32px] border border-[#d8ccb9] bg-white/85 p-6 shadow-[0_18px_45px_rgba(23,50,77,0.06)] md:p-7">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#17324d] text-[#f7f2ea]">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Activation</p>
                <h2 style={EDITORIAL_HEADING} className="mt-1 text-3xl leading-tight tracking-[-0.03em] text-[#17324d]">
                  Activer avec un code
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              Si un code d’activation t’a été envoyé, active ton plan ici sans repasser par le checkout ni ressaisir un paiement.
            </p>

            {isAuthenticated ? (
              <form onSubmit={redeemCode} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="NEXUS-PRO-XXXX-XXXX"
                  className="flex-1 rounded-2xl border border-[#d8ccb9] bg-[#fcfaf6] px-4 py-3 text-sm font-mono tracking-wider text-[#17324d] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20"
                  maxLength={25}
                  disabled={codeLoading}
                />
                <button
                  type="submit"
                  disabled={codeLoading || !codeInput.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17324d] px-5 py-3 text-sm font-bold text-[#f7f2ea] transition-colors hover:bg-[#0f2740] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {codeLoading ? 'Activation...' : 'Activer'}
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-[22px] border border-[#d8ccb9] bg-[#fcfaf6] p-4 text-sm leading-7 text-slate-600">
                <Link href="/login" className="font-semibold text-[#17324d] underline">Connecte-toi d’abord</Link> pour rattacher le code à ton compte, puis reviens ici pour l’activer.
              </div>
            )}

            {codeSuccess ? (
              <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-[#9cccaf] bg-[#eef8f0] p-4 text-sm text-[#25543d]" role="status">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{codeSuccess.message}</span>
              </div>
            ) : null}
            {codeError ? (
              <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-[#b65050]/25 bg-[#fff0ef] p-4 text-sm text-[#8f2d2d]" role="alert">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{codeError}</span>
              </div>
            ) : null}
          </article>

          <article className="rounded-[32px] border border-[#17324d] bg-[#17324d] p-6 text-[#f7f2ea] shadow-[0_24px_70px_rgba(23,50,77,0.16)] md:p-7">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#e4d4bd]">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d7c4aa]">Paiement alternatif</p>
                <h2 style={EDITORIAL_HEADING} className="mt-1 text-3xl leading-tight tracking-[-0.03em] text-white">
                  Commander un code en Tunisie
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-200">
              Pour l’instant, les abonnements payants s’activent par virement bancaire ou via WhatsApp. Flouci et le paiement carte reviendront dès que leurs intégrations seront finalisées.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#d7c4aa]" />
                  <div>
                    <p className="text-sm font-semibold text-white">Paiement Flouci</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Flouci est prévu mais pas encore actif en production. Si tu veux activer ton plan maintenant, utilise plutôt le virement bancaire ci-dessous.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setError(TEMPORARY_PAYMENT_UNAVAILABLE_MESSAGE)}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#17324d] transition hover:bg-[#f8f1e7]"
                      >
                        Flouci bientôt disponible
                      </button>
                      <button
                        type="button"
                        disabled
                        className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/40"
                      >
                        Paiement Flouci — bientôt
                      </button>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-slate-300">
                      Pour activer le plan maintenant, utilise le virement bancaire avec l’email du compte ou ton identifiant utilisateur en référence.
                    </p>
                    {error ? (
                      <div className="mt-4 flex items-start gap-3 rounded-[20px] border border-white/10 bg-white/10 p-3 text-sm text-white" role="alert">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#d7c4aa]" />
                        <span>{error}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <div className="flex items-start gap-3">
                  <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-[#d7c4aa]" />
                  <div>
                    <p className="text-sm font-semibold text-white">Virement bancaire</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">Ajoutez l’email du compte ou l’identifiant utilisateur en motif. Le plan est activé après vérification du règlement.</p>
                    <div className="mt-4 grid gap-2 rounded-[20px] bg-[#0f2740] p-4 text-sm text-slate-100 sm:grid-cols-2">
                      {BANK_TRANSFER_ROWS.map((row) => (
                        <div key={row.label} className={row.label === 'Titulaire' ? 'sm:col-span-2' : ''}>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#d7c4aa]">{row.label}</p>
                          <p className="mt-1 break-all font-semibold text-white">{row.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <a
                        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Confirmation de virement Nexus Réussite')}&body=${encodeURIComponent('Bonjour,%0D%0AJe vous envoie la référence de mon virement pour activation.%0D%0AEmail du compte : %0D%0AIdentifiant utilisateur (si connu) : %0D%0APlan réglé : Premium / Pro%0D%0ARéférence du virement : ')}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#17324d] transition hover:bg-[#f8f1e7]"
                      >
                        Envoyer la référence
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] bg-[#0f2740] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#d7c4aa]" />
                <p className="text-sm leading-6 text-slate-200">
                  Facturation en dinar tunisien. Premium = 99 TND/mois. Pro = 129 TND/mois. Le code d’activation est envoyé après confirmation du virement bancaire ou via WhatsApp.
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="pb-16">
          <div className="rounded-[34px] border-2 border-[#25d366] bg-white/90 p-6 shadow-[0_18px_45px_rgba(37,211,102,0.12)] md:p-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25d366] text-white">
                <MessageCircle className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#25d366]">Canal actif</p>
                <h2 style={EDITORIAL_HEADING} className="mt-1 text-3xl leading-tight tracking-[-0.03em] text-[#17324d]">
                  Souscrire via WhatsApp
                </h2>
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
              Tu préfères être accompagné directement ? Envoie-nous un message WhatsApp pour choisir ton plan, poser tes questions et recevoir ton code d'activation.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-[24px] border border-[#d8ccb9] bg-[#f8f4ec] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Numéro WhatsApp</p>
                <p className="mt-2 text-2xl font-bold tracking-wide text-[#17324d]">{WHATSAPP_NUMBER}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Disponible pour répondre à tes questions sur les plans, t'aider à choisir et finaliser ton abonnement.
                </p>
              </div>
              <div className="rounded-[24px] border border-[#d8ccb9] bg-[#f8f4ec] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Comment ça marche</p>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  <li className="flex items-start gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-[10px] font-bold text-white">1</span>Envoie &quot;Bonjour&quot; sur WhatsApp</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-[10px] font-bold text-white">2</span>Choisis ton plan (Premium ou Pro)</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-[10px] font-bold text-white">3</span>Reçois ton code d'activation</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-7 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#1fba59] hover:shadow-lg"
              >
                <MessageCircle className="h-5 w-5" />
                Ouvrir WhatsApp
              </a>
              <a
                href={`https://wa.me/21699192829?text=${encodeURIComponent('Bonjour, je souhaite souscrire à un abonnement Nexus Réussite.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#25d366] bg-white px-7 py-3.5 text-base font-semibold text-[#25d366] transition-all hover:-translate-y-0.5 hover:bg-[#f0fdf4]"
              >
                Envoyer un message pré-rempli
              </a>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-[20px] bg-[#f0fdf4] p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#25d366]" />
              <p className="text-sm leading-6 text-slate-600">
                Ce numéro est géré par l'équipe Nexus Réussite. Aucun paiement n'est demandé via WhatsApp — le règlement se fait exclusivement par virement bancaire.
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Comparaison détaillée</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl">
                Les quotas sont visibles, donc la décision reste rationnelle.
              </h2>
            </div>
            <div className="rounded-full border border-[#d8ccb9] bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600">
              <Clock3 className="mr-2 inline h-4 w-4 text-[#0f766e]" />
              Compare en 30 secondes
            </div>
          </div>

          <div className="mt-10 overflow-x-auto rounded-[30px] border border-[#d8ccb9] bg-white/85 shadow-[0_18px_45px_rgba(23,50,77,0.05)]">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-[#f8f4ec] text-left">
                  <th className="px-5 py-4 font-bold text-[#17324d]">Fonctionnalité</th>
                  <th className="px-5 py-4 text-center font-bold text-[#17324d]">Free</th>
                  <th className="px-5 py-4 text-center font-bold text-[#0f766e]">Premium</th>
                  <th className="px-5 py-4 text-center font-bold text-[#17324d]">Pro</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row, index) => (
                  <tr key={row.label} className={index % 2 === 0 ? 'bg-white' : 'bg-[#fbf8f2]'}>
                    <td className="px-5 py-3.5 font-medium text-[#17324d]">{row.label}</td>
                    <td className="px-5 py-3.5 text-center text-slate-600">{row.free}</td>
                    <td className="px-5 py-3.5 text-center text-slate-600">{row.premium}</td>
                    <td className="px-5 py-3.5 text-center text-slate-600">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 pb-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">FAQ facturation</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl">
              Les questions d’argent doivent être traitées aussi clairement que le reste.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              Si la page est bonne, elle coupe court aux hésitations inutiles : quotas, changement de plan, paiement et alternatives sont lisibles sans jargon.
            </p>

            <div className="mt-8 rounded-[30px] border border-[#17324d] bg-[#17324d] p-6 text-[#f7f2ea] shadow-[0_24px_70px_rgba(23,50,77,0.14)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d7c4aa]">Prêt à passer à l&apos;action ?</p>
              <h3 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-white">
                La préparation sérieuse commence avec Premium.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                Le plan gratuit donne un aperçu du workflow. Le Premium débloque le rythme de travail nécessaire pour progresser réellement avant l&apos;épreuve.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/login?mode=register" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f7f2ea] px-5 py-3 text-sm font-bold text-[#17324d] transition-all hover:-translate-y-0.5 hover:bg-white">
                  Comparer les plans
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/" className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-[#f7f2ea] transition-colors hover:bg-white/6">
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
