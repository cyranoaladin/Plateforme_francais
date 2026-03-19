'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Compass,
  FileStack,
  GraduationCap,
  KeyRound,
  Landmark,
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
  fontFamily: "var(--font-display)",
};

/* ─── Types billing ─── */
type SubscriptionPlan = 'FREE' | 'PREMIUM' | 'PRO';
type CheckoutPlan = 'PREMIUM' | 'PRO';
type BillingStatusPayload = {
  authenticated?: boolean;
  subscription: { plan: SubscriptionPlan; status: string; currentPeriodEnd: string | null };
  lastPayment: { orderRef: string; plan: SubscriptionPlan; status: string; amountMillimes: number; currency: string } | null;
};

/* ─── Données hero ─── */
const FRICTION_REMOVERS = ['Inscription gratuite', 'Prêt en 3 minutes', 'Premiers ateliers sans payer'];

/* ─── Données méthode ─── */
const STEPS = [
  {
    number: '01', title: 'Configure ton profil EAF', icon: Compass,
    description: "Choisis tes œuvres au programme, indique ton niveau et tes objectifs. La plateforme s'adapte à ton point de départ.",
    student: "Tu renseignes tes textes, ton niveau et tes priorités.",
    platform: 'Nexus construit un parcours cohérent et prépare tes premiers ateliers.',
  },
  {
    number: '02', title: 'Travaille en conditions réelles', icon: PenSquare,
    description: "Chaque atelier te demande une vraie production : oral enregistré, analyse rédigée, exercice de langue, copie corrigée.",
    student: "Tu écris, tu parles, tu justifies tes choix et tu corriges.",
    platform: 'Nexus guide ta méthode, cite les sources utiles et refuse de rédiger à ta place.',
  },
  {
    number: '03', title: 'Progresse séance après séance', icon: RefreshCcw,
    description: "Chaque correction identifie tes points faibles et oriente la suite. Rien ne se perd entre deux séances.",
    student: "Tu sais exactement quoi retravailler et dans quel ordre.",
    platform: 'Nexus priorise tes lacunes et propose la prochaine séance adaptée.',
  },
];

/* ─── Données ateliers ─── */
const FEATURE_GROUPS = [
  { title: 'Atelier écrit', icon: FileStack, tone: 'bg-[var(--navy)] text-[var(--surface-parchment)] border-white/10', badge: 'Production longue', span: 'lg:col-span-7', body: "Dépose ta copie en PDF ou photo. Nexus la lit, la corrige rubrique par rubrique et te fournit un rapport clair à reprendre.", bullets: ['Dépôt PDF/image', 'Analyse automatique + correction structurée', 'Rapport PDF exploitable'] },
  { title: 'Oral officiel', icon: Mic, tone: 'bg-[var(--card)]/90 text-[var(--navy)] border-[var(--border-strong)]', badge: 'Format EAF', span: 'lg:col-span-5', body: "Entraîne-toi au format réel de l'oral : lecture, explication linéaire, grammaire et entretien, chacun noté selon le barème officiel.", bullets: ['Barème /2 /8 /2 /8', 'Relances pédagogiques', 'Œuvre choisie intégrée'] },
  { title: 'Corpus et citations', icon: ScanSearch, tone: 'bg-[var(--card)]/90 text-[var(--navy)] border-[var(--border-strong)]', badge: 'Sources visibles', span: 'lg:col-span-4', body: "Chaque réponse peut s'appuyer sur le BO, Eduscol, les rapports de jury et les œuvres au programme. Les sources sont toujours visibles.", bullets: ['Citations internes', 'Recherche intelligente dans le corpus', 'Corpus 2025-2026'] },
  { title: 'Langue et quiz adaptatif', icon: BrainCircuit, tone: 'bg-[var(--surface-warm-accent)] text-[var(--navy)] border-[var(--border-strong)]', badge: 'Relance ciblée', span: 'lg:col-span-4', body: "Travaille la grammaire avec des quiz ciblés sur tes points faibles. Les erreurs identifiées en atelier alimentent tes prochains exercices.", bullets: ['Axes du programme', 'Retour immédiat', 'Priorisation des lacunes'] },
  { title: 'Guidage personnalisé et mémoire de progression', icon: MessageCircleMore, tone: 'bg-[var(--card)]/90 text-[var(--navy)] border-[var(--border-strong)]', badge: 'Accompagnement actif', span: 'lg:col-span-4', body: "Nexus retient tes forces et tes lacunes d'une séance à l'autre pour te proposer le bon exercice au bon moment.", bullets: ['Relances contextuelles', 'Détection de tes points à retravailler', 'Séances suivantes cohérentes'] },
];

/* ─── Données audiences ─── */
const AUDIENCE_CARDS = [
  { icon: GraduationCap, title: "Pour l'élève", body: "Tu sais quoi faire maintenant, quoi reprendre ensuite et comment progresser sans te disperser." },
  { icon: UsersRound, title: 'Pour les parents', body: "Un cadre clair et vérifiable : méthode structurée, sources officielles, progression compréhensible." },
  { icon: ShieldCheck, title: 'Pour les enseignants', body: "Les exercices, les barèmes et les sources respectent les attendus EAF. Rien d'approximatif, rien de hors-programme." },
];
const COMPARISON_ROWS = [
  { label: 'Structure du travail', generic: 'Une réponse isolée à chaque question, sans mémoire de ton parcours.', nexus: "Un parcours continu : tu produis, tu corriges, tu progresses d'une séance à l'autre." },
  { label: 'Cadre pédagogique', generic: 'Risque de dérive : copie intégrale ou corrigé prêt à rendre.', nexus: "Refus de rédiger à ta place. Nexus te guide vers une réponse que tu construis toi-même." },
  { label: 'Références', generic: 'Sources floues ou réponses déconnectées du programme EAF.', nexus: "Sources citées, corpus du BO et rapports de jury accessibles directement dans chaque réponse." },
  { label: 'Format EAF', generic: "Pas de format pour l'oral EAF, pas de barème officiel, pas d'ateliers structurés.", nexus: "Oral noté en /2, /8, /2, /8, ateliers dédiés par compétence et corrections réutilisables." },
];

/* ─── Données confiance ─── */
const TRUST_BLOCKS = [
  { icon: Quote, title: 'Sources visibles, jamais opaques', description: "Quand le corpus intervient, l'élève voit ce qui fonde la réponse : BO, Eduscol, rapports de jury, œuvres au programme." },
  { icon: UserRoundCheck, title: 'Cadre pédagogique strict', description: "La plateforme refuse la dissertation ou le commentaire complets et bascule vers une alternative guidée, constructive et traçable." },
  { icon: LockKeyhole, title: 'Protection des comptes et des mineurs', description: "Sessions sécurisées, accès contrôlé, conformité RGPD et refus de la publicité ciblée sur les comptes mineurs." },
];

/* ─── Données plans ─── */
const PLANS = [
  {
    id: 'FREE' as SubscriptionPlan, title: 'Freemium', priceTND: '0 TND', period: '',
    bullets: ['1 session orale / mois', '2 corrections écrites / mois', '3 échanges guidés / jour', 'Échantillon de bibliothèque'],
    cta: 'Essayer gratuitement', ctaDisabledLabel: 'Plan actuel', highlighted: false,
    kicker: 'Teste la méthode gratuitement.',
    note: "Accès limité pour découvrir les ateliers et la méthode. Idéal pour tester avant de s'engager.",
  },
  {
    id: 'PREMIUM' as SubscriptionPlan, title: 'Premium', priceTND: '99 TND', period: '/ mois',
    bullets: ['10 sessions orales / semaine', '20 corrections écrites / mois', '100 échanges guidés / jour', 'Analyse de copies : 20 / mois', 'Parcours personnalisé', 'Rapport PDF oral', 'Bibliothèque complète'],
    cta: 'Passer à Premium', ctaDisabledLabel: 'Plan actuel', checkoutPlan: 'PREMIUM' as CheckoutPlan, highlighted: true,
    kicker: 'La préparation complète pour réussir ton EAF.',
    note: "Le meilleur point d\u2019équilibre quand tu travailles chaque semaine et que tu veux supprimer les plafonds trop vite atteints.",
  },
  {
    id: 'PRO' as SubscriptionPlan, title: 'Masterium', priceTND: '129 TND', period: '/ mois',
    bullets: ['Oral illimité', 'Corrections écrites illimitées', 'Accompagnement guidé illimité', 'Analyse de copies : 50 / mois', 'Volume de travail illimité', 'Recherche avancée dans le corpus', 'Historique oral complet', 'Support prioritaire'],
    cta: 'Passer à Masterium', ctaDisabledLabel: 'Plan actuel', checkoutPlan: 'PRO' as CheckoutPlan, highlighted: false,
    kicker: "Pour viser la mention et travailler sans limite.",
    note: "Aucune limite sur les quotas. Pour ceux qui travaillent intensément et veulent une préparation maximale.",
  },
];

const FEATURE_ROWS = [
  { label: 'Sessions orales / mois', free: '1', premium: '10 / semaine', pro: 'Illimité' },
  { label: 'Corrections écrites / mois', free: '2', premium: '20', pro: 'Illimité' },
  { label: 'Échanges guidés / jour', free: '3', premium: '100', pro: 'Illimité' },
  { label: 'Analyse de copies / mois', free: '—', premium: '20', pro: '50' },
  { label: 'Volume de travail quotidien', free: 'Limité', premium: 'Élevé', pro: 'Illimité' },
  { label: 'Rapport PDF oral', free: '—', premium: 'Oui', pro: 'Oui' },
  { label: 'Recherche avancée corpus', free: '—', premium: '—', pro: 'Oui' },
  { label: 'Support', free: 'FAQ', premium: 'Email', pro: 'Prioritaire' },
];

/* ─── Données FAQ ─── */
const FAQ_ITEMS = [
  { question: "Est-ce que Nexus peut écrire ma copie à ma place ?", answer: "Non, et c'est voulu. Nexus refuse de rédiger un commentaire ou une dissertation complets. L'objectif est de t'aider à construire ta réponse toi-même, avec la bonne méthode et les bonnes références." },
  { question: "Sur quelles sources s'appuie la plateforme ?", answer: "Nexus s'appuie sur le Bulletin officiel, les ressources Eduscol, les rapports de jury et les œuvres au programme. Chaque réponse qui mobilise le corpus affiche ses sources pour que tu puisses vérifier." },
  { question: "Quelle est la différence avec ChatGPT ou un autre chatbot ?", answer: "Un chatbot généraliste ne connaît pas le barème EAF, ne structure pas de parcours et ne refuse pas de tricher. Nexus est conçu spécifiquement pour l'EAF : oral au format officiel (/2, /8, /2, /8), corrections structurées, corpus vérifiable et progression d'une séance à l'autre." },
  { question: "Mes données sont-elles protégées ?", answer: "Oui. Sessions sécurisées, contrôle d'accès strict et conformité RGPD. Les comptes de mineurs bénéficient d'une protection renforcée : consentement parental requis pour les moins de 15 ans, aucune publicité ciblée." },
  { question: "Mon enfant mineur peut-il utiliser la plateforme ?", answer: "Oui. Les moins de 15 ans doivent fournir l'email d'un parent lors de l'inscription (conformément au RGPD). La plateforme ne diffuse aucune publicité et protège les données de tous les utilisateurs." },
  { question: "Que se passe-t-il quand j'atteins un quota ?", answer: "Ton travail est conservé. La plateforme t'indique clairement quel plan te permettrait de continuer. Tu ne perds rien : ton parcours, tes corrections et ta progression restent intacts." },
  { question: "Le plan gratuit est-il vraiment utile ?", answer: "Oui. Le plan Freemium donne accès aux ateliers écrit, oral et langue avec des quotas limités, plus un échantillon de la bibliothèque. C'est suffisant pour tester la méthode et décider si tu veux aller plus loin." },
  { question: "Comment fonctionne le paiement ?", answer: "Les abonnements peuvent être activés par virement bancaire ou par code d'activation. Le paiement par carte et Flouci seront disponibles prochainement. Aucun engagement : tu peux résilier à tout moment." },
];


/* ─── Decorative helpers ─── */
function TricolorLine() {
  return (
    <div className="absolute top-0 left-0 right-0 h-1 flex">
      <span className="flex-1" style={{background:'var(--french-blue)',opacity:0.3}}/>
      <span className="flex-1 bg-white"/>
      <span className="flex-1" style={{background:'var(--french-red)',opacity:0.3}}/>
    </div>
  );
}

function FrenchBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 border text-sm font-medium" style={{background:'rgba(30,58,95,0.1)',borderColor:'rgba(30,58,95,0.15)',color:'var(--navy)'}}>
      <span className="french-flag-inline"><span className="fb"/><span className="fw"/><span className="fr"/></span>
      {children}
    </span>
  );
}

/* ─── Sous-composants ─── */
function FaqItem({ question, answer, index, open, onToggle }: { question: string; answer: string; index: number; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)]/85 shadow-[var(--shadow-md)]">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left" aria-expanded={open}>
        <div className="flex items-start gap-4">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-warm-accent)] text-xs font-bold text-[var(--navy)]">{String(index + 1).padStart(2, '0')}</span>
          <span className="pt-1 text-sm font-semibold text-[var(--navy)] md:text-base">{question}</span>
        </div>
        {open ? <ChevronUp className="h-5 w-5 shrink-0 text-[var(--text-muted)]" /> : <ChevronDown className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />}
      </button>
      {open ? <div className="px-5 pb-5 text-sm leading-7 text-[var(--text-secondary)] sm:pl-[4.75rem]">{answer}</div> : null}
    </div>
  );
}

/* ─── CTA Banner réutilisable ─── */
function CtaBanner({ title, subtitle, primary, secondary }: { title: string; subtitle?: string; primary: { label: string; href: string; track?: string }; secondary?: { label: string; href: string } }) {
  return (
    <div className="relative overflow-hidden rounded-[24px] bg-hero-gradient px-6 py-8 text-white shadow-[var(--shadow-xl)] md:px-10 md:py-10">
      <TricolorLine />
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-15" style={{background:'var(--french-blue)'}} />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-15" style={{background:'var(--french-red)'}} />
      <div className="absolute top-1/2 left-1/3 w-2 h-2 rounded-full animate-pulse opacity-40" style={{background:'var(--gold)'}} />

      <h3 style={EDITORIAL_HEADING} className="text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">{title}</h3>
      {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 font-serif">{subtitle}</p> : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href={primary.href}
          onClick={() => primary.track && track({ name: 'cta_click', props: { cta: primary.track, path: '/' } })}
          className="btn-gold"
        >
          {primary.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
        {secondary ? (
          <Link href={secondary.href} className="btn-outline-white">
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Step Visual Card ─── */
function StepVisual({ step }: { step: typeof STEPS[number] }) {
  const orbitColors = ['var(--french-blue)', 'var(--gold)', 'var(--french-red)', 'var(--teal)'];
  return (
    <div className="relative flex items-center justify-center bg-gradient-to-br from-white to-[var(--surface-light)] rounded-2xl p-8 min-h-[200px]">
      {/* French corner accent */}
      <div className="absolute -top-px -right-px w-12 h-12 overflow-hidden rounded-tr-2xl">
        <div className="absolute top-0 right-0 w-16 h-16 transform rotate-45 translate-x-6 -translate-y-6" style={{background:'rgba(0,35,149,0.1)'}} />
      </div>

      {/* Dashed orbit circle */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="60" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="6 4" opacity="0.4" />
      </svg>

      {/* Center number circle */}
      <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-[var(--navy)] text-white text-xl font-bold shadow-lg">
        {step.number}
      </div>

      {/* Orbiting circles */}
      {[
        { top: '10%', left: '50%', transform: 'translateX(-50%)' },
        { bottom: '10%', left: '50%', transform: 'translateX(-50%)' },
        { top: '50%', left: '10%', transform: 'translateY(-50%)' },
        { top: '50%', right: '10%', transform: 'translateY(-50%)' },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-4 h-4 rounded-full animate-pulse"
          style={{ ...pos, background: orbitColors[i], opacity: 0.5, animationDelay: `${i * 300}ms` } as React.CSSProperties}
        />
      ))}
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
        const payload = await apiFetch<BillingStatusPayload>('/api/v1/payments/clictopay/status', {
          redirectOnUnauthorized: false,
        });
        setBilling(payload);
        setIsAuthenticated(payload.authenticated ?? true);
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
    <div className="relative isolate min-h-screen overflow-x-clip bg-[var(--surface-white)] text-[var(--text-heading)]">

      <PublicHeader />

      {/* ════════════════ HERO — Gradient Bleu Académique ════════════════ */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Image with French Colors */}
        <div className="absolute inset-0">
          <img src="/hero-bg.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--navy)]/95 via-[var(--navy)]/80 to-transparent" />
        </div>
        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 rounded-full particle opacity-60 particle-red" />
          <div className="absolute top-40 left-1/4 w-3 h-3 rounded-full particle opacity-40 particle-gold particle-delay-1" />
          <div className="absolute bottom-32 left-20 w-2 h-2 bg-white rounded-full particle opacity-50 particle-delay-2" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full particle opacity-40 particle-red particle-delay-3" />
          <div className="absolute top-2/3 right-20 w-2 h-2 rounded-full particle opacity-30 particle-gold particle-delay-4" />
        </div>

        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left — texte */}
            <div className="text-center lg:text-left animate-fade-up">
              <div className="badge-french mb-5 inline-flex">
                <span className="french-flag-inline"><span className="fb" /><span className="fw" /><span className="fr" /></span>
                <span>Bac de Français — Programme officiel</span>
              </div>

              <h1 style={EDITORIAL_HEADING} className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Parcours EAF complet{" "}
                <span className="text-[var(--gold)]">2026</span>
              </h1>

              <p className="mt-4 text-lg font-serif text-white/90 lg:text-xl">
                Prépare ton Bac de Français avec méthode, les bonnes sources et un vrai suivi.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center lg:justify-start">
                <Link
                  href="/login?mode=register"
                  onClick={() => track({ name: 'cta_click', props: { cta: 'hero_register', path: '/' } })}
                  className="btn-gold"
                >
                  Commencer gratuitement <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#comment-ca-marche"
                  onClick={() => track({ name: 'cta_click', props: { cta: 'hero_method', path: '/' } })}
                  className="btn-outline-white"
                >
                  Découvrir la méthode
                </a>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60 justify-center lg:justify-start">
                {FRICTION_REMOVERS.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />{item}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — image étudiant */}
            <div className="relative hidden lg:flex justify-center animate-fade-up" style={{ animationDelay: '200ms' }}>
              <img
                src="/hero-student.jpg"
                alt="Étudiant préparant le Bac de Français"
                className="w-full max-w-sm rounded-2xl shadow-2xl"
              />
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-[var(--gold)]/20 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[var(--french-red)]/20 rounded-full blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ MÉTHODE ════════════════ */}
      <section id="comment-ca-marche" className="relative overflow-hidden scroll-mt-24 py-20 md:py-24">
        <TricolorLine />
        {/* Decorative blurred circles */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-blue)'}} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-red)'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-8 pointer-events-none" style={{background:'var(--gold)'}} />
        {/* Floating particles */}
        <div className="absolute top-32 right-20 w-2 h-2 rounded-full animate-pulse opacity-40" style={{background:'var(--french-blue)'}} />
        <div className="absolute bottom-40 left-16 w-1.5 h-1.5 rounded-full animate-pulse opacity-30 particle-delay-2" style={{background:'var(--french-red)'}} />
        <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full animate-pulse opacity-25 particle-delay-3" style={{background:'var(--gold)'}} />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <FrenchBadge>La méthode</FrenchBadge>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl">
              Une méthode en 3 étapes pour progresser concrètement.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)]">
              Diagnostic, production, correction, relance : chaque séance s'enchaîne logiquement pour que tu progresses vraiment d'une semaine à l'autre.
            </p>
            <div className="mt-8 rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)]/85 p-6 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Ce que la plateforme garantit</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-body)]">
                {['Une configuration de parcours rapide et personnalisée.', 'Des ateliers qui te font produire, pas juste lire.', 'Des corrections qui orientent ta prochaine séance.'].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--teal)]" /><span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login?mode=register" onClick={() => track({ name: 'cta_click', props: { cta: 'method_register', path: '/' } })} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-deep)] px-5 py-3 text-sm font-bold text-[var(--navy-dark)] shadow-gold transition-all hover:-translate-y-0.5">
                Configurer mon parcours <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#plans" className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--navy)] bg-transparent px-5 py-3 text-sm font-semibold text-[var(--navy)] transition-colors hover:bg-[var(--navy)] hover:text-white">
                Voir les tarifs
              </a>
            </div>
          </div>
          <div className="space-y-5">
            {STEPS.map((step, index) => (
              <article key={step.number} className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)]/85 p-6 shadow-[var(--shadow-md)]" style={{ animationDelay: `${0.1 + index * 0.08}s` }}>
                <div className={`flex flex-col gap-6 lg:flex-row lg:items-start ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Content side */}
                  <div className="flex-1 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--navy)] text-sm font-bold text-[var(--surface-parchment)]">{step.number}</span>
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-warm-accent)] text-[var(--teal)]">
                        <step.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 style={EDITORIAL_HEADING} className="mt-5 text-3xl leading-tight tracking-[-0.03em] text-[var(--navy)]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{step.description}</p>
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Côté élève</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{step.student}</p>
                      </div>
                      <div className="rounded-[24px] bg-[var(--navy)] p-4 text-[var(--surface-parchment)]">
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--border-warm)]">Côté Nexus</p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">{step.platform}</p>
                      </div>
                    </div>
                  </div>
                  {/* Visual side */}
                  <div className="flex-shrink-0 lg:w-[200px]">
                    <StepVisual step={step} />
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
          title="Prêt à tester la méthode ?"
          subtitle="L'inscription est gratuite et prend moins de 3 minutes. Tu accèdes directement à tes premiers ateliers, sans engagement."
          primary={{ label: "Commencer gratuitement", href: "/login?mode=register", track: "inter_cta_1_register" }}
          secondary={{ label: "Voir les tarifs", href: "#plans" }}
        />
      </div>

      {/* ════════════════ ATELIERS ════════════════ */}
      <section id="fonctionnalites" className="relative overflow-hidden scroll-mt-24 py-20 md:py-24">
        <TricolorLine />
        {/* Decorative blurred circles */}
        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-blue)'}} />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-red)'}} />
        <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full blur-3xl opacity-8 pointer-events-none" style={{background:'var(--gold)'}} />
        {/* Floating particles */}
        <div className="absolute top-24 left-12 w-2 h-2 rounded-full animate-pulse opacity-30" style={{background:'var(--french-blue)'}} />
        <div className="absolute bottom-32 right-16 w-1.5 h-1.5 rounded-full animate-pulse opacity-25 particle-delay-1" style={{background:'var(--gold)'}} />
        <div className="absolute top-2/3 left-1/3 w-2 h-2 rounded-full animate-pulse opacity-20 particle-delay-3" style={{background:'var(--french-red)'}} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <FrenchBadge>Ateliers EAF</FrenchBadge>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl">
                Tout ce qu'il faut pour réussir l'EAF, organisé par usage réel.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">Quatre ateliers complémentaires qui couvrent l'ensemble de l'épreuve : écrit, oral, langue et corpus.</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-12">
            {FEATURE_GROUPS.map((feature, index) => (
              <article key={feature.title} className={`${feature.span} ${feature.tone} relative rounded-[24px] border p-6 shadow-[var(--shadow-md)] card-hover hover:-translate-y-1 transition-transform md:p-7`} style={{ animationDelay: `${0.08 + index * 0.06}s` }}>
                {/* French corner accent */}
                <div className="absolute -top-px -right-px w-12 h-12 overflow-hidden rounded-tr-2xl">
                  <div className="absolute top-0 right-0 w-16 h-16 transform rotate-45 translate-x-6 -translate-y-6" style={{background:'rgba(0,35,149,0.1)'}} />
                </div>
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

          {/* Coaching section */}
          <div className="mt-10 rounded-[24px] border border-[var(--border-strong)] overflow-hidden shadow-[var(--shadow-lg)]">
            <div className="bg-hero-gradient p-6 md:p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
                <div>
                  <FrenchBadge>Coaching intégré</FrenchBadge>
                  <h3 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-white">
                    Ta progression en un coup d'oeil.
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/80">
                    Un suivi continu qui te montre exactement où tu en es et ce qu'il reste à travailler.
                  </p>
                  {/* Progress bar */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white/90">Progression globale</span>
                      <span className="text-sm font-bold text-[var(--gold)]">78%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-deep)]" style={{width:'78%'}} />
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[{ value: '12', label: 'ateliers' }, { value: '8.5', label: 'heures' }, { value: '14.2', label: 'score' }].map((s) => (
                      <div key={s.label} className="text-center rounded-xl bg-white/10 p-3">
                        <div className="text-xl font-bold text-[var(--gold)]">{s.value}</div>
                        <div className="text-xs text-white/60">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    'Détection automatique des points faibles',
                    'Relances ciblées entre les séances',
                    'Priorisation intelligente des exercices',
                    'Suivi de progression par compétence',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                      <p className="text-sm leading-6 text-white/80">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)]/80 p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="grid gap-6 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
              <div>
                <FrenchBadge>Fil directeur</FrenchBadge>
                <h3 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-[var(--navy)]">Un fil conducteur de la copie à la révision.</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[{ icon: BookOpenText, title: 'Produire', text: 'Chaque atelier débouche sur un résultat concret : copie corrigée, oral noté ou exercice validé.' }, { icon: ScanSearch, title: 'Justifier', text: "Les corrections citent les sources et rappellent les attentes du programme." }, { icon: BrainCircuit, title: 'Réactiver', text: "Chaque retour alimente la séance suivante pour que rien ne se perde." }].map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-4 card-hover hover:-translate-y-1 transition-transform">
                    <item.icon className="h-5 w-5 text-[var(--teal)]" />
                    <p className="mt-3 text-sm font-bold text-[var(--navy)]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ POURQUOI NEXUS ════════════════ */}
      <section id="pourquoi-nexus" className="relative overflow-hidden scroll-mt-24 py-8 md:py-12">
        <TricolorLine />
        {/* Decorative blurred circles */}
        <div className="absolute -top-16 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-blue)'}} />
        <div className="absolute -bottom-16 left-0 w-56 h-56 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-red)'}} />
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 rounded-full animate-pulse opacity-30" style={{background:'var(--gold)'}} />
        <div className="absolute bottom-24 right-24 w-1.5 h-1.5 rounded-full animate-pulse opacity-25 particle-delay-2" style={{background:'var(--french-blue)'}} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)]/80 p-6 shadow-[var(--shadow-md)] md:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div>
                <FrenchBadge>Pourquoi Nexus Réussite</FrenchBadge>
                <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl">
                  Conçu pour l'élève, rassurant pour les parents, crédible pour les profs.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)]">
                  Chaque décision pédagogique est pensée pour que l'élève progresse, que le parent comprenne la méthode et que l'enseignant reconnaisse un cadre sérieux.
                </p>
                <div className="mt-8 grid gap-3">
                  {AUDIENCE_CARDS.map((card) => (
                    <article key={card.title} className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-4 card-hover hover:-translate-y-1 transition-transform">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy)] text-[var(--surface-parchment)]"><card.icon className="h-5 w-5" /></div>
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--navy)]">{card.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{card.body}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/login?mode=register" onClick={() => track({ name: 'cta_click', props: { cta: 'why_register', path: '/' } })} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-deep)] px-6 py-3.5 text-sm font-bold text-[var(--navy-dark)] shadow-gold transition-all hover:-translate-y-0.5">
                    Essayer gratuitement <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="#plans" className="inline-flex items-center justify-center rounded-full border-2 border-[var(--navy)] px-6 py-3.5 text-sm font-semibold text-[var(--navy)] transition-colors hover:bg-[var(--navy)] hover:text-white">Voir les tarifs</a>
                </div>
              </div>
              <div className="rounded-[24px] bg-[var(--navy)] p-5 text-[var(--surface-parchment)] shadow-[var(--shadow-xl)] md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--border-warm)]">Ce qui change pour toi</p>
                    <h3 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-white">
                      Ce qui distingue Nexus d'un simple chatbot.
                    </h3>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-on-navy-soft)]">comparaison</div>
                </div>
                <div className="mt-6 space-y-4">
                  {COMPARISON_ROWS.map((row) => (
                    <div key={row.label} className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--border-warm)]">{row.label}</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Outil généraliste</p>
                          <p className="mt-2 text-sm leading-6 text-slate-200">{row.generic}</p>
                        </div>
                        <div className="rounded-[22px] bg-[var(--surface-cream)] p-4 text-[var(--navy)]">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Nexus Réussite</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{row.nexus}</p>
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
      <section id="securite" className="relative overflow-hidden scroll-mt-24 bg-[var(--navy)] py-20 text-[var(--surface-parchment)] md:py-24">
        <TricolorLine />
        {/* Decorative blurred circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-blue)'}} />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-red)'}} />
        <div className="absolute top-1/2 right-1/3 w-40 h-40 rounded-full blur-3xl opacity-8 pointer-events-none" style={{background:'var(--gold)'}} />
        {/* Floating particles */}
        <div className="absolute top-24 right-32 w-2 h-2 rounded-full animate-pulse opacity-30 bg-white" />
        <div className="absolute bottom-32 left-24 w-1.5 h-1.5 rounded-full animate-pulse opacity-20 particle-delay-2" style={{background:'var(--gold)'}} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 border text-sm font-medium" style={{background:'rgba(255,255,255,0.08)',borderColor:'rgba(255,255,255,0.15)',color:'white'}}>
                <span className="french-flag-inline"><span className="fb"/><span className="fw"/><span className="fr"/></span>
                Engagements non négociables
              </span>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl">
                Tes données, ton travail et ta confiance sont protégés.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">Cadre pédagogique strict, sources vérifiables, sessions sécurisées et respect des données personnelles : voici nos engagements concrets.</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-5 md:grid-cols-3">
              {TRUST_BLOCKS.map((block) => (
                <article key={block.title} className="rounded-[24px] border border-white/10 bg-white/8 p-6 backdrop-blur-sm card-hover hover:-translate-y-1 transition-transform">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-cream)] text-[var(--navy)]"><block.icon className="h-5 w-5" /></div>
                  <h3 style={EDITORIAL_HEADING} className="mt-5 text-2xl leading-tight tracking-[-0.03em] text-white">{block.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{block.description}</p>
                </article>
              ))}
            </div>
            <aside className="rounded-[24px] border border-white/10 bg-[var(--navy-dark)] p-6 shadow-[var(--shadow-lg)] md:p-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--border-warm)]">
                <ShieldCheck className="h-3.5 w-3.5" /> Garantie Nexus
              </div>
              <h3 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-white">Nos garanties concrètes pour chaque élève.</h3>
              <div className="mt-6 space-y-3">
                {["Pas de rédaction intégrale de copie à la place de l'élève.", "Citations internes affichables quand le corpus est mobilisé.", "Parcours aligné sur les œuvres officielles et les attendus EAF.", "Sécurité d'accès et respect des données des comptes mineurs."].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/6 px-4 py-3">
                    <CheckCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <Link href="/login?mode=register" onClick={() => track({ name: 'cta_click', props: { cta: 'trust_register', path: '/' } })} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-deep)] px-5 py-3 text-sm font-bold text-[var(--navy-dark)] shadow-gold transition-all hover:-translate-y-0.5">
                  Commencer gratuitement <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ════════════════ PLANS ════════════════ */}
      <section id="plans" className="relative overflow-hidden scroll-mt-24 py-20 md:py-24">
        <TricolorLine />
        {/* Decorative blurred circles */}
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-blue)'}} />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-red)'}} />
        {/* Floating particles */}
        <div className="absolute top-32 right-24 w-2 h-2 rounded-full animate-pulse opacity-30" style={{background:'var(--gold)'}} />
        <div className="absolute bottom-40 left-16 w-1.5 h-1.5 rounded-full animate-pulse opacity-25 particle-delay-3" style={{background:'var(--french-blue)'}} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <FrenchBadge>Plans et tarifs</FrenchBadge>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl">
                Choisis le rythme qui correspond à ta préparation.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              Commence gratuitement pour tester la méthode. Passe à un plan supérieur quand ton rythme de travail le demande.
            </p>
          </div>

          {checkoutError ? (
            <div className="mt-6 flex items-start gap-3 rounded-[24px] border border-[var(--error-muted)]/25 bg-[var(--error-bg)] p-4 text-sm text-[var(--error-dark)]" role="alert">
              <span>{checkoutError}</span>
            </div>
          ) : null}

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = isAuthenticated && plan.id === currentPlan;
              const isLoadingPlan = pendingPlan !== null && plan.checkoutPlan === pendingPlan;
              const accent = plan.highlighted
                ? 'border-[var(--navy)] bg-[var(--navy)] text-[var(--surface-parchment)] shadow-[var(--shadow-xl)]'
                : isCurrent ? 'border-[var(--teal)] bg-[var(--surface-warm)] text-[var(--navy)]'
                : 'border-[var(--border-strong)] bg-[var(--card)]/85 text-[var(--navy)]';
              return (
                <article key={plan.id} className={`${accent} relative rounded-[24px] border p-6 card-hover hover:-translate-y-1 transition-transform`}>
                  {/* French corner accent */}
                  <div className="absolute -top-px -right-px w-12 h-12 overflow-hidden rounded-tr-2xl">
                    <div className="absolute top-0 right-0 w-16 h-16 transform rotate-45 translate-x-6 -translate-y-6" style={{background: plan.highlighted ? 'rgba(255,255,255,0.1)' : 'rgba(0,35,149,0.1)'}} />
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.26em] opacity-70">{plan.kicker}</p>
                      <h3 style={EDITORIAL_HEADING} className="mt-3 text-4xl tracking-[-0.03em]">{plan.title}</h3>
                    </div>
                    {plan.highlighted ? (
                      <span className="badge-gold inline-flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> Recommandé
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-4xl font-bold">{plan.priceTND}</span>
                    {plan.period ? <span className="pb-1 text-sm opacity-75">{plan.period}</span> : null}
                  </div>
                  <p className={`mt-3 text-sm leading-7 ${plan.highlighted ? 'text-slate-200' : 'text-[var(--text-secondary)]'}`}>{plan.note}</p>
                  <ul className="mt-6 space-y-3 text-sm leading-6">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <CheckCircle2 className={`mt-1 h-4 w-4 shrink-0 ${plan.highlighted ? 'text-[var(--border-warm)]' : 'text-[var(--teal)]'}`} />
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
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${plan.highlighted ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-deep)] text-[var(--navy-dark)] shadow-gold hover:-translate-y-0.5' : 'bg-[var(--navy)] text-white hover:-translate-y-0.5 hover:bg-[var(--navy-dark)]'}`}
                  >
                    {isLoadingPlan ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirection...</>
                      : !isAuthenticated ? (plan.id === 'FREE' ? 'Essayer gratuitement' : 'Choisir ce plan')
                      : isCurrent ? plan.ctaDisabledLabel
                      : plan.cta}
                  </button>
                </article>
              );
            })}
          </div>

          {/* Tableau comparatif */}
          <div className="mt-12 overflow-x-auto rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)]/85 shadow-[var(--shadow-md)]">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-[var(--surface-warm)] text-left">
                  <th className="px-5 py-4 font-bold text-[var(--navy)]">Fonctionnalité</th>
                  <th className="px-5 py-4 text-center font-bold text-[var(--navy)]">Freemium</th>
                  <th className="px-5 py-4 text-center font-bold text-[var(--teal)]">Premium</th>
                  <th className="px-5 py-4 text-center font-bold text-[var(--navy)]">Masterium</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row, index) => (
                  <tr key={row.label} className={index % 2 === 0 ? 'bg-[var(--card)]' : 'bg-[var(--surface-warm)]'}>
                    <td className="px-5 py-3.5 font-medium text-[var(--navy)]">{row.label}</td>
                    <td className="px-5 py-3.5 text-center text-[var(--text-secondary)]">{row.free}</td>
                    <td className="px-5 py-3.5 text-center text-[var(--text-secondary)]">{row.premium}</td>
                    <td className="px-5 py-3.5 text-center text-[var(--text-secondary)]">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paiement alternatif */}
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <article className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)]/85 p-6 shadow-[var(--shadow-md)] md:p-7">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--navy)] text-[var(--surface-parchment)]"><KeyRound className="h-5 w-5" /></div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Activation</p>
                  <h3 style={EDITORIAL_HEADING} className="mt-1 text-2xl leading-tight tracking-[-0.03em] text-[var(--navy)]">Activer avec un code</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">Si un code d'activation t'a été envoyé, active ton plan ici sans repasser par le checkout.</p>
              {isAuthenticated ? (
                <form onSubmit={redeemCode} className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <input type="text" value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} placeholder="NEXUS-PRO-XXXX-XXXX" className="flex-1 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-paper)] px-4 py-3 text-sm font-mono tracking-wider text-[var(--navy)] outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20" maxLength={25} disabled={codeLoading} />
                  <button type="submit" disabled={codeLoading || !codeInput.trim()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--navy)] px-5 py-3 text-sm font-bold text-[var(--surface-parchment)] transition-colors hover:bg-[var(--navy-dark)] disabled:cursor-not-allowed disabled:opacity-50">
                    {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{codeLoading ? 'Activation...' : 'Activer'}
                  </button>
                </form>
              ) : (
                <div className="mt-6 rounded-[22px] border border-[var(--border-strong)] bg-[var(--surface-paper)] p-4 text-sm leading-7 text-[var(--text-secondary)]">
                  <Link href="/login" className="font-semibold text-[var(--navy)] underline">Connecte-toi d'abord</Link> pour rattacher le code à ton compte.
                </div>
              )}
              {codeSuccess ? <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-[var(--success-border-accent)] bg-[var(--success-bg-soft)] p-4 text-sm text-[var(--success-text-dark)]" role="status"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{codeSuccess.message}</span></div> : null}
              {codeError ? <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-[var(--error-muted)]/25 bg-[var(--error-bg)] p-4 text-sm text-[var(--error-dark)]" role="alert"><span>{codeError}</span></div> : null}
            </article>

            <article className="rounded-[24px] border border-[var(--navy)] bg-[var(--navy)] p-6 text-[var(--surface-parchment)] shadow-[var(--shadow-xl)] md:p-7">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[var(--text-on-navy-soft)]"><Landmark className="h-5 w-5" /></div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--border-warm)]">Paiement alternatif</p>
                  <h3 style={EDITORIAL_HEADING} className="mt-1 text-2xl leading-tight tracking-[-0.03em] text-white">Flouci & virement bancaire</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-200">Le virement bancaire est disponible avec activation manuelle du plan. Flouci sera disponible prochainement. Contacte-nous pour recevoir les coordonnées bancaires.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/60 cursor-not-allowed">Flouci — bientôt disponible</span>
                <Link href="/contact?subject=virement" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--navy)] transition hover:bg-[var(--surface-warm-section)]">Envoyer la référence virement</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ════════════════ CTA INTER-SECTION 2 ════════════════ */}
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <CtaBanner
          title="Passe à la vitesse supérieure avec Premium ou Masterium."
          subtitle="Premium à 99 TND/mois — Masterium à 129 TND/mois. Aucun engagement long terme. Résilie quand tu veux."
          primary={{ label: "Comparer les plans", href: "/pricing", track: "inter_cta_2_pricing" }}
          secondary={{ label: "Essayer gratuitement", href: "/login?mode=register" }}
        />
      </div>

      {/* ════════════════ FAQ ════════════════ */}
      <section id="faq" className="relative overflow-hidden scroll-mt-24 py-20 md:py-24">
        <TricolorLine />
        {/* Decorative blurred circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-blue)'}} />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-red)'}} />
        {/* Floating particles */}
        <div className="absolute top-28 left-16 w-2 h-2 rounded-full animate-pulse opacity-30" style={{background:'var(--gold)'}} />
        <div className="absolute bottom-36 right-20 w-1.5 h-1.5 rounded-full animate-pulse opacity-25 particle-delay-1" style={{background:'var(--french-blue)'}} />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.76fr_1.24fr] lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <FrenchBadge>Questions fréquentes</FrenchBadge>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl">
              Tout ce que tu veux savoir avant de commencer.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)]">Méthode, sources, sécurité, accessibilité, paiement — les réponses honnêtes sont ici.</p>
            <div className="mt-8 rounded-[24px] border border-[var(--border-strong)] bg-[var(--navy)] p-6 text-[var(--surface-parchment)] shadow-[var(--shadow-lg)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[var(--text-on-navy-soft)]"><MessageSquareText className="h-5 w-5" /></div>
              <h3 style={EDITORIAL_HEADING} className="mt-5 text-3xl leading-tight tracking-[-0.03em] text-white">Besoin d'aller plus loin ?</h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">Compare les plans, choisis l'offre adaptée à ton rythme de travail et commence à progresser.</p>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/pricing" onClick={() => track({ name: 'cta_click', props: { cta: 'faq_pricing', path: '/' } })} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-deep)] px-5 py-3 text-sm font-bold text-[var(--navy-dark)] shadow-gold transition-all hover:-translate-y-0.5">
                  Voir les offres <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#plans" className="text-sm font-semibold text-[var(--border-warm)] transition-colors hover:text-white">Revoir les plans et tarifs</a>
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
      <section className="relative overflow-hidden pb-20 pt-8 md:pb-24 md:pt-12">
        <TricolorLine />
        {/* Decorative blurred circles */}
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-blue)'}} />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-10 pointer-events-none" style={{background:'var(--french-red)'}} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[24px] bg-hero-gradient px-6 py-10 text-white shadow-[var(--shadow-xl)] md:px-10 md:py-12">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <div className="badge-french mb-4 inline-flex">
                  <span className="french-flag-inline"><span className="fb" /><span className="fw" /><span className="fr" /></span>
                  <span>Passage à l&#39;action</span>
                </div>
                <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl">
                  Commence gratuitement, progresse à ton rythme, et décide ensuite.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/80 font-serif">
                  Inscription gratuite, mise en route en 3 minutes, premiers ateliers accessibles immédiatement. Tu paies seulement quand tu en as vraiment besoin.
                </p>
              </div>

              {/* Timeline visual */}
              <div className="rounded-[24px] bg-[var(--navy-dark)] p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--gold)]">Dès l&#39;entrée</p>
                <div className="mt-5 space-y-0">
                  {[
                    { num: 1, label: 'Inscription', detail: '3 minutes', active: true },
                    { num: 2, label: 'Configuration', detail: 'Choix des oeuvres', active: true },
                    { num: 3, label: 'Premier atelier', detail: 'Immédiat', active: true },
                    { num: 4, label: 'Correction', detail: 'Retour personnalisé', active: false },
                  ].map((step, i) => (
                    <div key={step.num} className="flex items-start gap-4">
                      {/* Timeline column */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 ${step.active ? 'text-[var(--navy-dark)]' : 'border border-white/20 text-white/60'}`}
                          style={step.active ? {background:'var(--gold)'} : {background:'rgba(255,255,255,0.1)'}}
                        >
                          {step.num}
                        </div>
                        {i < 3 && <div className="w-px h-6 bg-white/15 my-1" />}
                      </div>
                      {/* Content */}
                      <div className="pt-1.5 pb-3">
                        <p className="text-sm font-semibold text-white">{step.label}</p>
                        <p className="text-xs text-white/50">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Small stats grid */}
                <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
                  {[{ value: '3min', label: 'inscription' }, { value: '12', label: 'oeuvres' }, { value: '4', label: 'ateliers' }].map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="text-lg font-bold text-[var(--gold)]">{s.value}</div>
                      <div className="text-[11px] text-white/50">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/login?mode=register" onClick={() => track({ name: 'cta_click', props: { cta: 'final_register', path: '/' } })} className="btn-gold">
                Créer mon espace gratuit <ArrowRight className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => { track({ name: 'cta_click', props: { cta: 'final_premium', path: '/' } }); void startCheckout('PREMIUM', 'PREMIUM'); }} className="btn-outline-white">
                <Send className="h-4 w-4" /> Passer directement à Premium
              </button>
              <a href="#plans" className="inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-white/60 transition-colors hover:text-white">
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
