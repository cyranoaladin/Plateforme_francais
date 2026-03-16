'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  BrainCircuit,
  ChartColumn,
  CheckCircle2,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock3,
  Compass,
  FileStack,
  GraduationCap,
  KeyRound,
  Landmark,
  LibraryBig,
  Loader2,
  LockKeyhole,
  MessageCircleMore,
  MessageSquareText,
  Mic,
  PenSquare,
  Quote,
  RefreshCcw,
  ScanSearch,
  Send,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { apiFetch, isApiError } from '@/lib/api/client';
import { track } from '@/components/analytics/events';

/* ─── Design tokens ─── */
const EDITORIAL_HEADING = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

/* ─── Types billing ─── */
type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'PRO';
type CheckoutPlan = 'PREMIUM' | 'PRO';
type BillingStatusPayload = {
  subscription: { plan: SubscriptionPlan; status: string; currentPeriodEnd: string | null };
  lastPayment: { orderRef: string; plan: SubscriptionPlan; status: string; amountMillimes: number; currency: string } | null;
};

/* ─── Données hero ─── */
const MICRO_PROOFS = ['Oral officiel : /2 /8 /2 /8', 'Aucun paiement avant essai', 'Anti-copie actif', 'Sources internes visibles'];
const FRICTION_REMOVERS = ['Inscription gratuite', 'Onboarding ~3 minutes', 'Voir le produit avant de payer'];
const HERO_STATS = [
  { value: '3 min', label: 'pour un onboarding cadré' },
  { value: '4 ateliers', label: 'écrit, oral, langue, quiz' },
  { value: '12 œuvres', label: 'du programme voie générale' },
  { value: '1 cockpit', label: 'pour piloter la progression' },
];
const ORAL_PHASES = [
  { label: 'Lecture', score: '2/2' },
  { label: 'Explication', score: '6/8' },
  { label: 'Grammaire', score: '1.5/2' },
  { label: 'Entretien', score: '7/8' },
];
const SIGNALS = [
  { label: 'Question de grammaire', width: '72%' },
  { label: 'Structure de plan', width: '86%' },
  { label: 'Citations précises', width: '64%' },
];

/* ─── Données méthode ─── */
const STEPS = [
  {
    number: '01', title: 'Cadrer le point de départ', icon: Compass,
    description: "Œuvres choisies, objectifs, niveau perçu, contraintes de rythme : la plateforme comprend d'abord le terrain de jeu.",
    student: "L'élève renseigne son profil, ses œuvres et son niveau de départ.",
    platform: 'Nexus construit une base de progression cohérente et prépare les premiers ateliers.',
  },
  {
    number: '02', title: 'Produire dans un format exigeant', icon: PenSquare,
    description: 'Chaque atelier force une production concrète : réponse orale, analyse, correction de langue, copie déposée.',
    student: "L'élève écrit, parle, justifie, reprend et corrige.",
    platform: 'La plateforme balise la méthode, cite les références utiles et refuse les demandes de copie intégrale.',
  },
  {
    number: '03', title: 'Réinjecter le feedback au bon endroit', icon: RefreshCcw,
    description: "Le retour n'est pas décoratif : il alimente les signaux faibles, le parcours et les prochaines relances.",
    student: "L'élève sait précisément quoi retravailler et dans quel ordre.",
    platform: 'Nexus priorise les lacunes, propose la séance suivante et garde une mémoire utile.',
  },
];

/* ─── Données ateliers ─── */
const FEATURE_GROUPS = [
  { title: 'Atelier écrit', icon: FileStack, tone: 'bg-[#17324d] text-[#f7f2ea] border-white/10', badge: 'Production longue', span: 'lg:col-span-7', body: "Dépose une copie PDF ou image, récupère une lecture OCR, une correction par rubriques et un rapport clair à reprendre.", bullets: ['Dépôt PDF/image', 'OCR + correction structurée', 'Rapport PDF exploitable'] },
  { title: 'Oral officiel', icon: Mic, tone: 'bg-white/90 text-[#17324d] border-[#d8ccb9]', badge: 'Format EAF', span: 'lg:col-span-5', body: "Lecture, explication, grammaire et entretien restent visibles comme quatre séquences distinctes, avec leurs max officiels.", bullets: ['Barème /2 /8 /2 /8', 'Relances pédagogiques', 'Œuvre choisie intégrée'] },
  { title: 'Corpus et citations', icon: ScanSearch, tone: 'bg-white/90 text-[#17324d] border-[#d8ccb9]', badge: 'Sources visibles', span: 'lg:col-span-4', body: "Le guidage mobilise BO, Eduscol, rapports de jury et œuvres au programme avec des références internes visibles.", bullets: ['Citations internes', 'Recherche RAG documentée', 'Corpus 2025-2026'] },
  { title: 'Langue et quiz adaptatif', icon: BrainCircuit, tone: 'bg-[#efe7da] text-[#17324d] border-[#d8ccb9]', badge: 'Relance ciblée', span: 'lg:col-span-4', body: "Question de grammaire, erreurs de langue, quiz et thèmes faibles sont reliés au même diagnostic.", bullets: ['Axes du programme', 'Feedback immédiat', 'Priorisation des lacunes'] },
  { title: 'Guidage personnalisé et mémoire de progression', icon: MessageCircleMore, tone: 'bg-white/90 text-[#17324d] border-[#d8ccb9]', badge: 'Coaching actif', span: 'lg:col-span-4', body: "Chaque échange utile enrichit le profil, réactive les compétences à reprendre et influence la prochaine séance.", bullets: ['Relances contextuelles', 'Signaux faibles', 'Séances suivantes cohérentes'] },
];

/* ─── Données audiences ─── */
const AUDIENCE_CARDS = [
  { icon: GraduationCap, title: "Pour l'élève", body: "Le produit dit quoi faire maintenant, quoi reprendre ensuite et comment progresser sans se disperser." },
  { icon: UsersRound, title: 'Pour les parents', body: "La valeur perçue vient d'un cadre visible : workflow clair, garde-fous nets, progression compréhensible." },
  { icon: ShieldCheck, title: 'Pour les enseignants', body: "Le langage et les formats restent compatibles avec les attendus EAF, pas avec un outil généraliste déconnecté du programme." },
];
const COMPARISON_ROWS = [
  { label: 'Structure du travail', generic: 'Une réponse isolée à chaque prompt, sans mémoire réelle du parcours.', nexus: 'Un flux continu : produire, corriger, relancer, puis prioriser la suite.' },
  { label: 'Anti-triche', generic: 'Risque de dérive vers la copie complète ou le corrigé prêt à rendre.', nexus: "Refus de la copie intégrale et redirection vers une aide exploitable et méthodique." },
  { label: 'Références', generic: 'Sources peu lisibles ou réponses déconnectées du cadre EAF.', nexus: "Citations internes, corpus mobilisable et références rendues visibles quand elles comptent." },
  { label: 'Format EAF', generic: "Pas de structure native pour l'oral, les barèmes officiels ou les ateliers vraiment scolaires.", nexus: "Oral cadré en /2 /8 /2 /8, ateliers dédiés et retour réutilisable séance après séance." },
];

/* ─── Données confiance ─── */
const TRUST_BLOCKS = [
  { icon: Quote, title: 'Sources visibles, jamais opaques', description: "Quand le corpus intervient, l'élève voit ce qui fonde la réponse : BO, Eduscol, rapports de jury, œuvres au programme." },
  { icon: UserRoundCheck, title: 'Anti-copie intégré dans le produit', description: "La plateforme refuse la dissertation ou le commentaire complets et bascule vers une alternative guidée, constructive et traçable." },
  { icon: LockKeyhole, title: 'Protection des comptes et des mineurs', description: "Sessions sécurisées, protection CSRF, accès contrôlé, posture RGPD et refus de la publicité ciblée sur les comptes mineurs." },
];

/* ─── Données plans ─── */
const PLANS = [
  {
    id: 'FREE' as SubscriptionPlan, title: 'Freemium', priceTND: '0 TND', period: '',
    bullets: ['1 session orale / mois', '2 corrections écrites / mois', '3 échanges guidés / jour', 'Échantillon de bibliothèque'],
    cta: 'Découvrir gratuitement', ctaDisabledLabel: 'Plan actuel', highlighted: false,
    kicker: 'Faites vos premiers pas vers le Bac.',
    note: "Un accès limité pour juger la qualité du workflow avant de s\u2019engager.",
  },
  {
    id: 'PREMIUM' as SubscriptionPlan, title: 'Premium', priceTND: '99 TND', period: '/ mois',
    bullets: ['10 sessions orales / semaine', '20 corrections écrites / mois', '100 échanges guidés / jour', 'OCR 20 copies / mois', 'Parcours personnalisé', 'Rapport PDF oral', 'Bibliothèque complète'],
    cta: 'Passer à Premium', ctaDisabledLabel: 'Plan actuel', checkoutPlan: 'PREMIUM' as CheckoutPlan, highlighted: true,
    kicker: 'La méthode complète pour assurer votre réussite.',
    note: "Le meilleur point d\u2019équilibre quand tu travailles chaque semaine et que tu veux supprimer les plafonds trop vite atteints.",
  },
  {
    id: 'PRO' as SubscriptionPlan, title: 'Masterium', priceTND: '129 TND', period: '/ mois',
    bullets: ['Oral illimité', 'Corrections écrites illimitées', 'Accompagnement guidé illimité', 'OCR 50 copies / mois', 'Capacité 200k / jour', 'Graph RAG avancé', 'Historique oral complet', 'Support prioritaire'],
    cta: 'Passer à Masterium', ctaDisabledLabel: 'Plan actuel', checkoutPlan: 'PRO' as CheckoutPlan, highlighted: false,
    kicker: "L'excellence absolue pour décrocher la mention.",
    note: "Conçu pour les usages intensifs et ceux qui veulent zéro limite sur les quotas.",
  },
];

const FEATURE_ROWS = [
  { label: 'Sessions orales / mois', free: '1', premium: '10 / semaine', pro: 'Illimité' },
  { label: 'Corrections écrites / mois', free: '2', premium: '20', pro: 'Illimité' },
  { label: 'Échanges guidés / jour', free: '3', premium: '100', pro: 'Illimité' },
  { label: 'OCR copies / mois', free: '—', premium: '20', pro: '50' },
  { label: 'Capacité de traitement / jour', free: '5k', premium: '50k', pro: '200k' },
  { label: 'Rapport PDF oral', free: '—', premium: 'Oui', pro: 'Oui' },
  { label: 'Graph RAG', free: '—', premium: '—', pro: 'Oui' },
  { label: 'Support', free: 'FAQ', premium: 'Email', pro: 'Prioritaire' },
];

/* ─── Données FAQ ─── */
const FAQ_ITEMS = [
  { question: "La plateforme peut-elle écrire à ma place ?", answer: "Non. Le produit est conçu pour guider, structurer et corriger. Les demandes de commentaire ou de dissertation complets sont refusées et remplacées par une aide méthodologique exploitable." },
  { question: "Sur quelles sources s'appuie la plateforme ?", answer: "Le corpus mobilisable s'appuie sur les sources institutionnelles, les rapports de jury et les œuvres au programme. Quand une réponse utilise ce corpus, elle expose des références internes visibles et réutilisables." },
  { question: "Mes données sont-elles protégées ?", answer: "Oui. Session sécurisée, protection CSRF, contrôle d'accès, cadre RGPD et posture explicite sur les comptes mineurs : l'architecture de confiance fait partie du produit." },
  { question: "Que se passe-t-il si j'atteins un quota ?", answer: "La plateforme bloque l'action concernée, conserve ton travail et t'indique le plan utile pour reprendre sans repartir de zéro." },
  { question: "Comment fonctionne le paiement ?", answer: "Pour le moment, les abonnements payants sont activés par virement bancaire. Le paiement carte et Flouci seront disponibles prochainement." },
];

const BANK_TRANSFER_ROWS = [
  { label: 'Identifiant', value: '871456' },
  { label: 'Titulaire', value: 'STE M&M ACADEMY SUARL' },
  { label: 'Nature du compte', value: 'COMPTES CHEQUES ENTREPRISES' },
  { label: 'RIB', value: 'RIB25079000000156908404' },
  { label: 'IBAN', value: 'TN5925079000000156908404' },
  { label: 'BIC', value: 'BZITTNTT' },
] as const;

const CONTACT_EMAIL = 'contact@nexusreussite.academy';
const FLOUCI_INFO_URL = 'https://fr.flouci.com/feature/%20compte-professionnel';

/* ─── Sous-composants ─── */
function FaqItem({ question, answer, index, open, onToggle }: { question: string; answer: string; index: number; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-[26px] border border-[#d8ccb9] bg-white/85 shadow-[0_14px_35px_rgba(23,50,77,0.05)]">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left" aria-expanded={open}>
        <div className="flex items-start gap-4">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#efe7da] text-xs font-bold text-[#17324d]">{String(index + 1).padStart(2, '0')}</span>
          <span className="pt-1 text-sm font-semibold text-[#17324d] md:text-base">{question}</span>
        </div>
        {open ? <ChevronUp className="h-5 w-5 shrink-0 text-slate-500" /> : <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />}
      </button>
      {open ? <div className="px-5 pb-5 pl-[4.75rem] text-sm leading-7 text-slate-600">{answer}</div> : null}
    </div>
  );
}

/* ─── CTA Banner réutilisable ─── */
function CtaBanner({ title, subtitle, primary, secondary }: { title: string; subtitle?: string; primary: { label: string; href: string; track?: string }; secondary?: { label: string; href: string } }) {
  return (
    <div className="rounded-[32px] border border-[#17324d] bg-[#17324d] px-6 py-8 text-[#f7f2ea] shadow-[0_24px_70px_rgba(23,50,77,0.22)] md:px-10 md:py-10">
      <h3 style={EDITORIAL_HEADING} className="text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">{title}</h3>
      {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">{subtitle}</p> : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href={primary.href}
          onClick={() => primary.track && track({ name: 'cta_click', props: { cta: primary.track, path: '/' } })}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f7f2ea] px-6 py-3.5 text-base font-bold text-[#17324d] transition-all hover:-translate-y-0.5 hover:bg-white"
        >
          {primary.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
        {secondary ? (
          <Link href={secondary.href} className="inline-flex items-center justify-center rounded-full border border-white/16 px-6 py-3.5 text-base font-semibold text-[#f7f2ea] transition-colors hover:bg-white/8">
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Page principale ─── */
export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billing, setBilling] = useState<BillingStatusPayload | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<CheckoutPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeSuccess, setCodeSuccess] = useState<{ plan: string; message: string } | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    track({ name: 'page_view', props: { path: '/' } });
    const load = async () => {
      try {
        const payload = await apiFetch<BillingStatusPayload>('/api/v1/payments/clictopay/status');
        setBilling(payload);
        setIsAuthenticated(true);
      } catch (err) {
        if (isApiError(err) && err.status === 401) {
          setIsAuthenticated(false);
        }
      }
    };
    void load();
  }, []);

  const currentPlan = billing?.subscription.plan ?? 'FREE';

  const startCheckout = async (plan: CheckoutPlan, planId: string) => {
    if (!isAuthenticated) {
      track({ name: 'pricing_checkout_click', props: { plan: `${planId}_guest_redirect` } });
      window.location.assign('/login?mode=register');
      return;
    }
    setCheckoutError(null);
    setPendingPlan(plan);
    track({ name: 'pricing_checkout_click', props: { plan: planId } });
    try {
      const payload = await apiFetch<{ checkoutUrl?: string }>('/api/v1/payments/clictopay/init', { method: 'POST', json: { plan } });
      if (!payload.checkoutUrl) throw { status: 500, message: 'URL de paiement introuvable.' };
      window.location.assign(payload.checkoutUrl);
    } catch (err) {
      setCheckoutError(isApiError(err) ? err.message : 'Paiement indisponible. Réessaie dans quelques minutes.');
      setPendingPlan(null);
    }
  };

  const redeemCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!codeInput.trim() || codeLoading) return;
    setCodeError(null);
    setCodeSuccess(null);
    setCodeLoading(true);
    try {
      const res = await apiFetch<{ plan: string; endsAt: string; message: string }>('/api/v1/billing/redeem-code', { method: 'POST', json: { code: codeInput.trim() } });
      setCodeSuccess(res);
      setCodeInput('');
      try {
        const updated = await apiFetch<BillingStatusPayload>('/api/v1/payments/clictopay/status');
        setBilling(updated);
      } catch { /* noop */ }
    } catch (err) {
      setCodeError(isApiError(err) ? err.message : 'Erreur inattendue. Vérifie ta connexion.');
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-[#f4efe5] text-slate-900 [background-image:radial-gradient(circle_at_top_left,rgba(15,118,110,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(184,115,51,0.18),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(244,239,229,1))]">
      <style jsx global>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatY { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      `}</style>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_center_top,rgba(255,255,255,0.88),transparent_65%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[44rem] h-72 w-[74rem] -translate-x-1/2 rounded-full bg-[#0f766e]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-32 h-64 w-64 rounded-full bg-[#b87333]/14 blur-3xl" />

      <PublicHeader />

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative overflow-hidden border-b border-[#d8ccb9]/70">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:px-8 lg:pb-20">
          <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <div className="max-w-3xl [animation:fadeUp_.8s_ease-out_both]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#cabaa5] bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#17324d] shadow-sm">
                <BadgeCheck className="h-4 w-4 text-[#0f766e]" />
                Parcours EAF complet
              </div>
              <h1 style={EDITORIAL_HEADING} className="mt-7 text-5xl leading-[0.96] tracking-[-0.04em] text-[#17324d] sm:text-6xl lg:text-7xl">
                La préparation EAF qui se laisse vérifier avant d&apos;être achetée,
                <span className="block text-[#0f766e]">puis accompagne vraiment quand le rythme monte.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
                Nexus Réussite rassemble écrit, oral, langue, corpus officiel et historique de progression dans un même flux de travail. Tu vois le vrai produit en gratuit, puis tu montes en puissance seulement si le volume de travail le justifie.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/pricing" onClick={() => track({ name: 'cta_click', props: { cta: 'hero_pricing', path: '/' } })} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#17324d] px-6 py-3.5 text-base font-bold text-[#f7f2ea] shadow-[0_22px_60px_rgba(23,50,77,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#0f2740]">
                  Choisir mon offre <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#comment-ca-marche" onClick={() => track({ name: 'cta_click', props: { cta: 'hero_method', path: '/' } })} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#cabaa5] bg-white/85 px-6 py-3.5 text-base font-semibold text-[#17324d] transition-colors hover:bg-white">
                  Voir la méthode
                </a>
                <a href="#plans" onClick={() => track({ name: 'cta_click', props: { cta: 'hero_pricing', path: '/' } })} className="inline-flex items-center justify-center gap-2 rounded-full px-2 py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-[#17324d]">
                  Comparer les plans
                </a>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                {FRICTION_REMOVERS.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0f766e]" />{item}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {MICRO_PROOFS.map((item) => (
                  <span key={item} className="rounded-full border border-[#d8ccb9] bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">{item}</span>
                ))}
              </div>
            </div>

            <div className="relative [animation:fadeUp_.95s_ease-out_.12s_both]">
              <div className="rounded-[32px] border border-white/10 bg-[#17324d] p-6 text-[#f7f2ea] shadow-[0_32px_90px_rgba(23,50,77,0.28)] md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#e4d4bd]">Cockpit élève</p>
                    <h2 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-white">Une séance, des retours immédiatement exploitables.</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#f7f2ea]">
                    <Clock3 className="h-3.5 w-3.5 text-[#e4d4bd]" /> Session 2026
                  </div>
                </div>
                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/8 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d7c4aa]">Simulation orale</p>
                      <p className="mt-1 text-sm text-slate-200">Score ventilé selon le format officiel, sans zone floue.</p>
                    </div>
                    <div className="rounded-full bg-[#0f766e]/25 px-3 py-1 text-xs font-bold text-[#bde5df]">16.5 / 20</div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {ORAL_PHASES.map((phase) => (
                      <div key={phase.label} className="rounded-2xl border border-white/10 bg-[#102238] px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{phase.label}</p>
                        <p className="mt-2 text-lg font-bold text-white">{phase.score}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <LibraryBig className="h-4 w-4 text-[#e4d4bd]" /> Citations internes mobilisées
                    </div>
                    <ul className="mt-4 space-y-3 text-sm text-slate-200">
                      <li className="rounded-2xl bg-black/10 px-3 py-2">BO 2025, annexe 3 — attendus de l&apos;explication</li>
                      <li className="rounded-2xl bg-black/10 px-3 py-2">Rapport jury EAF 2024 — erreurs fréquentes à l&apos;oral</li>
                      <li className="rounded-2xl bg-black/10 px-3 py-2">Œuvre au programme — extrait contextualisé</li>
                    </ul>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <ChartColumn className="h-4 w-4 text-[#e4d4bd]" /> Axes prioritaires de relance
                    </div>
                    <div className="mt-4 space-y-4">
                      {SIGNALS.map((signal) => (
                        <div key={signal.label}>
                          <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-300">
                            <span>{signal.label}</span><span>à retravailler</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div className="h-2 rounded-full bg-gradient-to-r from-[#b87333] to-[#0f766e]" style={{ width: signal.width }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {HERO_STATS.map((stat, index) => (
              <div key={stat.label} className="rounded-[28px] border border-[#d8ccb9] bg-white/80 px-5 py-5 shadow-[0_12px_35px_rgba(23,50,77,0.07)] [animation:fadeUp_.8s_ease-out_both]" style={{ animationDelay: `${0.18 + index * 0.08}s` }}>
                <p style={EDITORIAL_HEADING} className="text-3xl tracking-[-0.03em] text-[#17324d]">{stat.value}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ MÉTHODE ════════════════ */}
      <section id="comment-ca-marche" className="scroll-mt-24 py-20 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">La méthode</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl">
              Une mécanique de progression, pas une accumulation d&apos;outils.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              La différence n&apos;est pas dans le nombre de modules. Elle est dans la continuité entre le diagnostic, la production, la correction et la relance.
            </p>
            <div className="mt-8 rounded-[30px] border border-[#d8ccb9] bg-white/85 p-6 shadow-[0_18px_45px_rgba(23,50,77,0.08)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Ce que la plateforme garantit</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                {['Un onboarding réellement utile, pas décoratif.', 'Des ateliers qui débouchent sur une production concrète.', 'Un feedback transformé en prochaine action.'].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#0f766e]" /><span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login?mode=register" onClick={() => track({ name: 'cta_click', props: { cta: 'method_register', path: '/' } })} className="inline-flex items-center gap-2 rounded-full bg-[#17324d] px-5 py-3 text-sm font-bold text-[#f7f2ea] transition-all hover:-translate-y-0.5 hover:bg-[#0f2740]">
                Démarrer l&apos;onboarding <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#plans" className="inline-flex items-center gap-2 rounded-full border border-[#cabaa5] bg-white/85 px-5 py-3 text-sm font-semibold text-[#17324d] transition-colors hover:bg-white">
                Voir les plans
              </a>
            </div>
          </div>
          <div className="space-y-5">
            {STEPS.map((step, index) => (
              <article key={step.number} className="rounded-[30px] border border-[#d8ccb9] bg-white/85 p-6 shadow-[0_18px_40px_rgba(23,50,77,0.06)]" style={{ animationDelay: `${0.1 + index * 0.08}s` }}>
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#17324d] text-sm font-bold text-[#f7f2ea]">{step.number}</span>
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8ccb9] bg-[#efe7da] text-[#0f766e]">
                        <step.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 style={EDITORIAL_HEADING} className="mt-5 text-3xl leading-tight tracking-[-0.03em] text-[#17324d]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{step.description}</p>
                  </div>
                  <div className="grid gap-3 md:w-[21rem]">
                    <div className="rounded-[24px] border border-[#d8ccb9] bg-[#f8f4ec] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Côté élève</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{step.student}</p>
                    </div>
                    <div className="rounded-[24px] bg-[#17324d] p-4 text-[#f7f2ea]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d7c4aa]">Côté Nexus</p>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{step.platform}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ CTA INTER-SECTION 1 ════════════════ */}
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <CtaBanner
          title="Prêt à voir le workflow en situation ?"
          subtitle="L'inscription gratuite prend moins de 3 minutes. Aucun paiement requis pour lancer l'onboarding et ouvrir les premiers ateliers."
          primary={{ label: "Comparer les plans", href: "/pricing", track: "inter_cta_1_pricing" }}
          secondary={{ label: "Comparer les plans", href: "#plans" }}
        />
      </div>

      {/* ════════════════ ATELIERS ════════════════ */}
      <section id="fonctionnalites" className="scroll-mt-24 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Ateliers EAF</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl">
                Tout ce qu&apos;il faut pour réussir l&apos;EAF, organisé par usage réel.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">Produire, corriger, citer, relancer, piloter — quatre ateliers qui couvrent l&apos;ensemble du parcours EAF.</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-12">
            {FEATURE_GROUPS.map((feature, index) => (
              <article key={feature.title} className={`${feature.span} ${feature.tone} rounded-[32px] border p-6 shadow-[0_18px_45px_rgba(23,50,77,0.08)] md:p-7`} style={{ animationDelay: `${0.08 + index * 0.06}s` }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black/10"><feature.icon className="h-5 w-5" /></div>
                  <span className="rounded-full border border-current/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em]">{feature.badge}</span>
                </div>
                <h3 style={EDITORIAL_HEADING} className="mt-6 text-3xl leading-tight tracking-[-0.03em]">{feature.title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 opacity-85 sm:text-base">{feature.body}</p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {feature.bullets.map((bullet) => (
                    <span key={bullet} className="inline-flex items-center gap-2 rounded-full border border-current/12 bg-black/5 px-3.5 py-1.5 text-xs font-semibold">
                      <Sparkles className="h-3.5 w-3.5" />{bullet}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 rounded-[32px] border border-[#d8ccb9] bg-white/80 p-6 shadow-[0_18px_45px_rgba(23,50,77,0.06)] md:p-7">
            <div className="grid gap-6 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Fil directeur</p>
                <h3 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-[#17324d]">De la copie à la relance, le même système garde le cap.</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[{ icon: BookOpenText, title: 'Produire', text: 'Toujours une sortie concrète : copie, oral, réponse ou correction.' }, { icon: ScanSearch, title: 'Justifier', text: "Les réponses exploitables gardent la trace des sources et des attentes." }, { icon: BrainCircuit, title: 'Réactiver', text: "Le feedback alimente ensuite le parcours au lieu de se perdre." }].map((item) => (
                  <div key={item.title} className="rounded-[26px] border border-[#d8ccb9] bg-[#f8f4ec] p-4">
                    <item.icon className="h-5 w-5 text-[#0f766e]" />
                    <p className="mt-3 text-sm font-bold text-[#17324d]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ POURQUOI NEXUS ════════════════ */}
      <section id="pourquoi-nexus" className="scroll-mt-24 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-[#d8ccb9] bg-white/80 p-6 shadow-[0_18px_55px_rgba(23,50,77,0.07)] md:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Pourquoi Nexus Réussite</p>
                <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl">
                  Un bon produit EAF doit convaincre trois personnes en même temps.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                  L&apos;élève veut une aide actionnable. Le parent veut un cadre crédible. L&apos;enseignant doit reconnaître une logique scolaire sérieuse.
                </p>
                <div className="mt-8 grid gap-3">
                  {AUDIENCE_CARDS.map((card) => (
                    <article key={card.title} className="rounded-[26px] border border-[#d8ccb9] bg-[#f8f4ec] p-4">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#17324d] text-[#f7f2ea]"><card.icon className="h-5 w-5" /></div>
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#17324d]">{card.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/login?mode=register" onClick={() => track({ name: 'cta_click', props: { cta: 'why_register', path: '/' } })} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#17324d] px-6 py-3.5 text-sm font-bold text-[#f7f2ea] transition-all hover:-translate-y-0.5 hover:bg-[#0f2740]">
                    Essayer gratuitement <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="#plans" className="inline-flex items-center justify-center rounded-full border border-[#cabaa5] bg-white px-6 py-3.5 text-sm font-semibold text-[#17324d] transition-colors hover:bg-[#fcfaf6]">Voir les plans</a>
                </div>
              </div>
              <div className="rounded-[32px] bg-[#17324d] p-5 text-[#f7f2ea] shadow-[0_26px_70px_rgba(23,50,77,0.16)] md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d7c4aa]">Différenciation utile</p>
                    <h3 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-white">
                      Là où un outil généraliste s&apos;arrête à une réponse, Nexus construit une continuité de travail.
                    </h3>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#e7dbc9]">comparaison</div>
                </div>
                <div className="mt-6 space-y-4">
                  {COMPARISON_ROWS.map((row) => (
                    <div key={row.label} className="rounded-[26px] border border-white/10 bg-white/6 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d7c4aa]">{row.label}</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Outil généraliste</p>
                          <p className="mt-2 text-sm leading-6 text-slate-200">{row.generic}</p>
                        </div>
                        <div className="rounded-[22px] bg-[#f4efe5] p-4 text-[#17324d]">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Nexus Réussite</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{row.nexus}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ CONFIANCE ════════════════ */}
      <section id="securite" className="scroll-mt-24 bg-[#17324d] py-20 text-[#f7f2ea] md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">Engagements non négociables</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl">
                Une plateforme commerciale crédible commence par ses garde-fous.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">La qualité ici ne repose pas sur des effets de style. Elle repose sur une architecture pédagogique nette et une confiance qui se voit dans l&apos;interface.</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-5 md:grid-cols-3">
              {TRUST_BLOCKS.map((block) => (
                <article key={block.title} className="rounded-[30px] border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4efe5] text-[#17324d]"><block.icon className="h-5 w-5" /></div>
                  <h3 style={EDITORIAL_HEADING} className="mt-5 text-2xl leading-tight tracking-[-0.03em] text-white">{block.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{block.description}</p>
                </article>
              ))}
            </div>
            <aside className="rounded-[32px] border border-white/10 bg-[#0f2740] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-[#d7c4aa]">
                <ShieldCheck className="h-3.5 w-3.5" /> Garantie Nexus
              </div>
              <h3 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-white">Ce que l&apos;interface rend explicite dès la page d&apos;accueil.</h3>
              <div className="mt-6 space-y-3">
                {["Pas de rédaction intégrale de copie à la place de l'élève.", "Citations internes affichables quand le corpus est mobilisé.", "Parcours aligné sur les œuvres officielles et les attendus EAF.", "Sécurité d'accès et respect des comptes mineurs assumés dans le produit."].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/6 px-4 py-3">
                    <CheckCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#d7c4aa]" />
                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <Link href="/login?mode=register" onClick={() => track({ name: 'cta_click', props: { cta: 'trust_register', path: '/' } })} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f7f2ea] px-5 py-3 text-sm font-bold text-[#17324d] transition-all hover:-translate-y-0.5 hover:bg-white">
                  Démarrer gratuitement <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ════════════════ PLANS ════════════════ */}
      <section id="plans" className="scroll-mt-24 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Plans et tarifs</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl">
                Trois rythmes, trois plafonds, une seule logique de valeur.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Teste d&apos;abord le vrai workflow. Choisis ensuite le plan qui suit ton rythme. Chaque niveau correspond à une intensité de préparation différente.
            </p>
          </div>

          {checkoutError ? (
            <div className="mt-6 flex items-start gap-3 rounded-[24px] border border-[#b65050]/25 bg-[#fff0ef] p-4 text-sm text-[#8f2d2d]" role="alert">
              <span>{checkoutError}</span>
            </div>
          ) : null}

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = isAuthenticated && plan.id === currentPlan;
              const isLoadingPlan = pendingPlan !== null && plan.checkoutPlan === pendingPlan;
              const accent = plan.highlighted
                ? 'border-[#17324d] bg-[#17324d] text-[#f7f2ea] shadow-[0_24px_70px_rgba(23,50,77,0.18)]'
                : isCurrent ? 'border-[#0f766e] bg-[#f8f4ec] text-[#17324d]'
                : 'border-[#d8ccb9] bg-white/85 text-[#17324d]';
              return (
                <article key={plan.id} className={`${accent} rounded-[32px] border p-6`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.26em] opacity-70">{plan.kicker}</p>
                      <h3 style={EDITORIAL_HEADING} className="mt-3 text-4xl tracking-[-0.03em]">{plan.title}</h3>
                    </div>
                    {plan.highlighted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                        <Sparkles className="h-3.5 w-3.5" /> Recommandé
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-4xl font-bold">{plan.priceTND}</span>
                    {plan.period ? <span className="pb-1 text-sm opacity-75">{plan.period}</span> : null}
                  </div>
                  <p className={`mt-3 text-sm leading-7 ${plan.highlighted ? 'text-slate-200' : 'text-slate-600'}`}>{plan.note}</p>
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
                    disabled={(isAuthenticated && isCurrent) || (isAuthenticated && !plan.checkoutPlan) || pendingPlan !== null}
                    onClick={() => {
                      if (!isAuthenticated) { window.location.assign('/login?mode=register'); return; }
                      if (plan.checkoutPlan) { track({ name: 'pricing_plan_select', props: { plan: plan.id } }); void startCheckout(plan.checkoutPlan, plan.id); }
                    }}
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${plan.highlighted ? 'bg-[#f7f2ea] text-[#17324d] hover:-translate-y-0.5 hover:bg-white' : 'bg-[#17324d] text-[#f7f2ea] hover:-translate-y-0.5 hover:bg-[#0f2740]'}`}
                  >
                    {isLoadingPlan ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirection...</>
                      : !isAuthenticated ? (plan.id === 'FREE' ? 'Découvrir gratuitement' : 'Choisir ce plan')
                      : isCurrent ? plan.ctaDisabledLabel
                      : plan.cta}
                  </button>
                </article>
              );
            })}
          </div>

          {/* Tableau comparatif */}
          <div className="mt-12 overflow-x-auto rounded-[30px] border border-[#d8ccb9] bg-white/85 shadow-[0_18px_45px_rgba(23,50,77,0.05)]">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-[#f8f4ec] text-left">
                  <th className="px-5 py-4 font-bold text-[#17324d]">Fonctionnalité</th>
                  <th className="px-5 py-4 text-center font-bold text-[#17324d]">Freemium</th>
                  <th className="px-5 py-4 text-center font-bold text-[#0f766e]">Premium</th>
                  <th className="px-5 py-4 text-center font-bold text-[#17324d]">Masterium</th>
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

          {/* Paiement alternatif */}
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <article className="rounded-[32px] border border-[#d8ccb9] bg-white/85 p-6 shadow-[0_18px_45px_rgba(23,50,77,0.06)] md:p-7">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#17324d] text-[#f7f2ea]"><KeyRound className="h-5 w-5" /></div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Activation</p>
                  <h3 style={EDITORIAL_HEADING} className="mt-1 text-2xl leading-tight tracking-[-0.03em] text-[#17324d]">Activer avec un code</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">Si un code d&apos;activation t&apos;a été envoyé, active ton plan ici sans repasser par le checkout.</p>
              {isAuthenticated ? (
                <form onSubmit={redeemCode} className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <input type="text" value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} placeholder="NEXUS-PRO-XXXX-XXXX" className="flex-1 rounded-2xl border border-[#d8ccb9] bg-[#fcfaf6] px-4 py-3 text-sm font-mono tracking-wider text-[#17324d] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20" maxLength={25} disabled={codeLoading} />
                  <button type="submit" disabled={codeLoading || !codeInput.trim()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17324d] px-5 py-3 text-sm font-bold text-[#f7f2ea] transition-colors hover:bg-[#0f2740] disabled:cursor-not-allowed disabled:opacity-50">
                    {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{codeLoading ? 'Activation...' : 'Activer'}
                  </button>
                </form>
              ) : (
                <div className="mt-6 rounded-[22px] border border-[#d8ccb9] bg-[#fcfaf6] p-4 text-sm leading-7 text-slate-600">
                  <Link href="/login" className="font-semibold text-[#17324d] underline">Connecte-toi d&apos;abord</Link> pour rattacher le code à ton compte.
                </div>
              )}
              {codeSuccess ? <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-[#9cccaf] bg-[#eef8f0] p-4 text-sm text-[#25543d]" role="status"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{codeSuccess.message}</span></div> : null}
              {codeError ? <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-[#b65050]/25 bg-[#fff0ef] p-4 text-sm text-[#8f2d2d]" role="alert"><span>{codeError}</span></div> : null}
            </article>

            <article className="rounded-[32px] border border-[#17324d] bg-[#17324d] p-6 text-[#f7f2ea] shadow-[0_24px_70px_rgba(23,50,77,0.16)] md:p-7">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#e4d4bd]"><Landmark className="h-5 w-5" /></div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d7c4aa]">Paiement alternatif</p>
                  <h3 style={EDITORIAL_HEADING} className="mt-1 text-2xl leading-tight tracking-[-0.03em] text-white">Flouci & virement bancaire</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-200">Le virement bancaire est actif avec activation manuelle du plan. Flouci sera disponible prochainement.</p>
              <div className="mt-5 grid gap-2 rounded-[20px] bg-[#0f2740] p-4 text-sm text-slate-100 sm:grid-cols-2">
                {BANK_TRANSFER_ROWS.map((row) => (
                  <div key={row.label} className={row.label === 'Titulaire' ? 'sm:col-span-2' : ''}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#d7c4aa]">{row.label}</p>
                    <p className="mt-1 break-all font-semibold text-white">{row.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/60 cursor-not-allowed">Flouci — bientôt disponible</span>
                <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Confirmation de virement Nexus Réussite')}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#17324d] transition hover:bg-[#f8f1e7]">Envoyer la référence virement</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ════════════════ CTA INTER-SECTION 2 ════════════════ */}
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <CtaBanner
          title="La préparation sérieuse commence avec Premium ou Masterium."
          subtitle="Premium à 99 TND/mois — Masterium à 129 TND/mois. Aucun engagement long terme. Résilie quand tu veux."
          primary={{ label: "Comparer les plans", href: "/pricing", track: "inter_cta_2_pricing" }}
          secondary={{ label: "Découvrir gratuitement", href: "/login?mode=register" }}
        />
      </div>

      {/* ════════════════ FAQ ════════════════ */}
      <section id="faq" className="scroll-mt-24 py-20 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.76fr_1.24fr] lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Questions fréquentes</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl">
              Les objections doivent être traitées avec autant de soin que les promesses.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">Anti-triche, sources, sécurité, accessibilité, paiement — les réponses honnêtes sont ici.</p>
            <div className="mt-8 rounded-[30px] border border-[#d8ccb9] bg-[#17324d] p-6 text-[#f7f2ea] shadow-[0_18px_45px_rgba(23,50,77,0.15)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#e4d4bd]"><MessageSquareText className="h-5 w-5" /></div>
              <h3 style={EDITORIAL_HEADING} className="mt-5 text-3xl leading-tight tracking-[-0.03em] text-white">Besoin d&apos;aller plus loin ?</h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">Compare les plans, choisis l&apos;offre adaptée à ton rythme de travail et commence à progresser.</p>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/pricing" onClick={() => track({ name: 'cta_click', props: { cta: 'faq_pricing', path: '/' } })} className="inline-flex items-center gap-2 rounded-full bg-[#f7f2ea] px-5 py-3 text-sm font-bold text-[#17324d] transition-all hover:-translate-y-0.5 hover:bg-white">
                  Voir les offres <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#plans" className="text-sm font-semibold text-[#d7c4aa] transition-colors hover:text-white">Revoir les plans et tarifs</a>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <FaqItem key={item.question} question={item.question} answer={item.answer} index={index} open={openFaq === index} onToggle={() => setOpenFaq((c) => (c === index ? null : index))} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ FINAL CTA ════════════════ */}
      <section className="pb-20 pt-8 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-[#17324d] bg-[#17324d] px-6 py-10 text-[#f7f2ea] shadow-[0_30px_90px_rgba(23,50,77,0.28)] md:px-10 md:py-12">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">Passage à l&apos;action</p>
                <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl">
                  Vérifie le produit, constate le cadre, puis décide si Premium vaut vraiment la peine.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200">
                  Inscription gratuite, mise en route rapide, workflow lisible dès la première séance. Le bon ordre est simple : voir d&apos;abord, choisir ensuite, payer seulement si l&apos;usage le justifie.
                </p>
              </div>
              <div className="rounded-[30px] bg-[#0f2740] p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d7c4aa]">Dès l&apos;entrée</p>
                <div className="mt-4 space-y-3">
                  {["Compte créé et onboarding lancé en quelques minutes", "Aucun paiement avant d'avoir vu le produit en situation", "Aucune rédaction intégrale générée à la place de l'élève"].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/6 px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d7c4aa]" />
                      <p className="text-sm leading-6 text-slate-200">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/login?mode=register" onClick={() => track({ name: 'cta_click', props: { cta: 'final_register', path: '/' } })} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f7f2ea] px-6 py-3.5 text-base font-bold text-[#17324d] transition-all hover:-translate-y-0.5 hover:bg-white">
                Créer mon espace gratuit <ArrowRight className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => { track({ name: 'cta_click', props: { cta: 'final_premium', path: '/' } }); void startCheckout('PREMIUM', 'PREMIUM'); }} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/16 px-6 py-3.5 text-base font-semibold text-[#f7f2ea] transition-colors hover:bg-white/8">
                <Send className="h-4 w-4" /> Passer directement à Premium
              </button>
              <a href="#plans" className="inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:text-white">
                Revoir les plans
              </a>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
