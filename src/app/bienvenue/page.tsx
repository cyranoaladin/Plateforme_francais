'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  PenTool,
  Mic,
  Brain,
  BookOpen,
  Search,
  MessageCircle,
  Shield,
  FileCheck,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Eye,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';

/* ─────────────────────── DATA ─────────────────────── */

const HERO_BADGES = [
  { icon: Mic, label: 'Oral conforme : /2 /8 /2 /8' },
  { icon: FileCheck, label: 'Citations de sources (BO/Eduscol)' },
  { icon: Shield, label: 'RGPD & mineurs' },
  { icon: Eye, label: 'Accessibilité (WCAG, mode dyslexie)' },
];

const STEPS = [
  {
    number: '1',
    title: 'Je crée mon compte',
    description: 'Inscription gratuite en 30 secondes avec email et mot de passe.',
    icon: Users,
  },
  {
    number: '2',
    title: 'Onboarding 3 minutes',
    description: 'Profil, choix des œuvres au programme, auto-évaluation de départ.',
    icon: GraduationCap,
  },
  {
    number: '3',
    title: 'Je démarre',
    description: 'Atelier écrit, oral, quiz ou parcours selon mes besoins identifiés.',
    icon: Sparkles,
  },
];

const FEATURES = [
  {
    icon: PenTool,
    title: 'Atelier écrit',
    description: 'Dépôt de copie, correction détaillée avec rubriques officielles et rapport PDF.',
  },
  {
    icon: Mic,
    title: 'Atelier oral',
    description: 'Simulation 4 phases (lecture /2, explication /8, grammaire /2, entretien /8) avec feedback structuré.',
  },
  {
    icon: Brain,
    title: 'Quiz adaptatif',
    description: '10 thèmes EAF, 3 niveaux, questions générées par IA à partir du programme officiel.',
  },
  {
    icon: BookOpen,
    title: 'Parcours personnalisé',
    description: 'Plan hebdomadaire adapté à tes faiblesses, progression visible semaine après semaine.',
  },
  {
    icon: Search,
    title: 'Bibliothèque & recherche RAG',
    description: 'Fiches méthode, vidéos, textes officiels et podcasts. Recherche sémantique dans 13 000+ extraits.',
  },
  {
    icon: MessageCircle,
    title: 'Tuteur IA',
    description: 'Répond avec citations vérifiées. Refuse de produire à ta place et propose une méthode.',
  },
];

const TRUST_BLOCKS = [
  {
    icon: FileCheck,
    title: 'Ancrage officiel',
    description: 'Toutes les corrections et recommandations sont basées sur le BO, Eduscol et les œuvres au programme 2025-2026. Les réponses citent leurs sources.',
  },
  {
    icon: Shield,
    title: 'Anti-triche pédagogique',
    description: 'La plateforme refuse de produire un commentaire, une dissertation ou une explication à ta place. Elle t\'aide à construire tes compétences, pas à les contourner.',
  },
  {
    icon: Lock,
    title: 'Sécurité & confidentialité',
    description: 'Sessions sécurisées (cookie HttpOnly), protection CSRF, limitation des tentatives de connexion. Données hébergées en Europe, conformité RGPD.',
  },
];

const PRICING_CARDS = [
  {
    title: 'Découverte',
    price: '0 TND',
    period: '',
    features: ['3 sessions oral/semaine', '1 correction écrit/mois', 'Quiz illimités', 'Bibliothèque complète'],
    cta: 'Commencer gratuitement',
    href: '/login?mode=register',
    highlighted: false,
  },
  {
    title: 'Mensuel',
    price: '14,90 TND',
    period: '/mois',
    features: ['Oral illimité', '10 corrections écrit/mois', 'Parcours personnalisé', 'OCR copies manuscrites', '7 jours d\'essai gratuit'],
    cta: 'Essayer 7 jours',
    href: '/login?mode=register',
    highlighted: true,
  },
  {
    title: 'Accès à vie',
    price: '89 TND',
    period: ' unique',
    features: ['Tout illimité', 'Accès permanent', 'Mises à jour incluses', 'Support prioritaire'],
    cta: 'Activer à vie',
    href: '/login?mode=register',
    highlighted: false,
  },
];

const FAQ_ITEMS = [
  {
    question: 'Est-ce que l\'IA peut écrire à ma place ?',
    answer: 'Non. La plateforme détecte automatiquement les demandes de production complète (commentaire, dissertation, explication linéaire) et les refuse. À la place, elle te guide méthodiquement pour construire ta propre réponse.',
  },
  {
    question: 'Sur quoi sont basés les conseils et corrections ?',
    answer: 'Toutes les recommandations s\'appuient sur le Bulletin Officiel, les ressources Eduscol et les œuvres au programme 2025-2026. Les réponses du tuteur IA citent systématiquement leurs sources.',
  },
  {
    question: 'Et mes données personnelles ?',
    answer: 'La plateforme est conforme au RGPD. Si tu es mineur, le consentement parental est requis. Tes données sont hébergées en Europe et ne sont jamais vendues. Tu peux demander leur suppression à tout moment.',
  },
  {
    question: 'La plateforme est-elle accessible aux élèves dys ?',
    answer: 'Oui. Un mode dyslexie (police OpenDyslexic, espacement augmenté) est disponible. La navigation clavier est complète et les contrastes respectent les normes WCAG AA.',
  },
  {
    question: 'Que faire si je suis parent ?',
    answer: 'Un espace parent dédié vous permet de suivre la progression, les scores et les faiblesses identifiées de votre enfant. Accessible depuis le menu après connexion.',
  },
];

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Sécurité', href: '#securite' },
];

/* ─────────────────── COMPONENTS ─────────────────── */

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-foreground text-sm md:text-base pr-4">{question}</span>
        {open ? <ChevronUp className="w-5 h-5 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

/* ─────────────────── PAGE ─────────────────── */

export default function BienvenuePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-white to-purple-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">

      {/* ═══ A. HEADER ═══ */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-950/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <Link href="/bienvenue" className="flex items-center gap-2.5">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Se connecter
            </Link>
            <Link
              href="/login?mode=register"
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors shadow-md"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-foreground"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3" aria-label="Navigation mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="text-sm font-medium text-foreground text-center py-2">Se connecter</Link>
              <Link href="/login?mode=register" className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold text-center">
                Commencer gratuitement
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* ═══ B. HERO ═══ */}
      <section className="relative overflow-hidden">
        {/* Decorative gradient blob */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-indigo-400/15 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-16 relative">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-full px-3 py-1 mb-6 font-bold">
            <GraduationCap className="w-3.5 h-3.5" /> Préparation EAF Première 2025-2026
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-foreground max-w-4xl">
            Prépare l&apos;EAF avec méthode&nbsp;: écrit, oral et langue{' '}
            <span className="text-violet-600 dark:text-violet-400">— accompagné par une IA qui te fait progresser.</span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mt-5 leading-relaxed">
            Entraînement réaliste + retours structurés + ressources à citations.
            Zéro &laquo;&nbsp;copier-coller&nbsp;&raquo;&nbsp;: tu construis tes compétences.
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-6">
            {HERO_BADGES.map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-border bg-card/60 backdrop-blur text-foreground"
              >
                <badge.icon className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                {badge.label}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-violet-600 text-white font-bold text-base hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40"
            >
              Commencer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-border bg-card text-foreground font-semibold text-base hover:bg-muted transition-colors"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
          <a href="#comment-ca-marche" className="inline-block mt-4 text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium">
            Voir comment ça marche &darr;
          </a>
        </div>
      </section>

      {/* ═══ C. COMMENT ÇA MARCHE ═══ */}
      <section id="comment-ca-marche" className="scroll-mt-20 py-16 md:py-24 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-foreground">Comment ça marche&nbsp;?</h2>
          <p className="text-muted-foreground text-center mt-2 text-sm">3 étapes, 3 minutes, tu es prêt.</p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {STEPS.map((step) => (
              <div key={step.number} className="relative rounded-2xl border border-border bg-card p-6 text-center hover:shadow-lg transition-shadow group">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <step.icon className="w-7 h-7" />
                </div>
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center shadow-md">
                  {step.number}
                </div>
                <h3 className="font-bold text-foreground text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors shadow-md text-sm"
            >
              Faire l&apos;onboarding <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ D. FONCTIONNALITÉS ═══ */}
      <section id="fonctionnalites" className="scroll-mt-20 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-foreground">Tout ce qu&apos;il faut pour réussir l&apos;EAF</h2>
          <p className="text-muted-foreground text-center mt-2 text-sm max-w-xl mx-auto">
            Chaque fonctionnalité est conçue pour te faire travailler activement, pas pour produire à ta place.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {FEATURES.map((feat) => (
              <article
                key={feat.title}
                className="rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground">{feat.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{feat.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ E. TRUST / POURQUOI C'EST FIABLE ═══ */}
      <section id="securite" className="scroll-mt-20 py-16 md:py-24 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-foreground">Pourquoi c&apos;est fiable&nbsp;?</h2>
          <p className="text-muted-foreground text-center mt-2 text-sm">Conformité, éthique pédagogique et sécurité par défaut.</p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {TRUST_BLOCKS.map((block) => (
              <div key={block.title} className="rounded-2xl border border-border bg-card p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <block.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-foreground text-lg">{block.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{block.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ F. TARIFS ═══ */}
      <section id="tarifs" className="scroll-mt-20 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-foreground">Tarifs simples, sans surprise</h2>
          <p className="text-muted-foreground text-center mt-2 text-sm">Commence gratuitement. Passe au premium quand tu veux.</p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {PRICING_CARDS.map((card) => (
              <div
                key={card.title}
                className={`rounded-2xl border p-6 flex flex-col ${
                  card.highlighted
                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 shadow-lg shadow-violet-600/10 ring-2 ring-violet-500/20'
                    : 'border-border bg-card'
                }`}
              >
                {card.highlighted && (
                  <span className="inline-flex self-start items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-violet-600 text-white mb-3">
                    <Sparkles className="w-3 h-3" /> Populaire
                  </span>
                )}
                <h3 className="text-xl font-bold text-foreground">{card.title}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-foreground">{card.price}</span>
                  {card.period && <span className="text-sm text-muted-foreground">{card.period}</span>}
                </div>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {card.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={card.href}
                  className={`mt-6 block text-center py-2.5 rounded-xl font-bold text-sm transition-colors ${
                    card.highlighted
                      ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-md'
                      : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                  }`}
                >
                  {card.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            <Link href="/pricing" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
              Voir le détail des quotas et options &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* ═══ G. FAQ ═══ */}
      <section id="faq" className="scroll-mt-20 py-16 md:py-24 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-foreground">Questions fréquentes</h2>
          <div className="mt-8 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Prêt à progresser&nbsp;?
          </h2>
          <p className="text-muted-foreground mt-3 text-sm max-w-lg mx-auto">
            Rejoins des centaines d&apos;élèves qui préparent l&apos;EAF avec méthode.
            Inscription gratuite, onboarding en 3 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/25 text-base"
            >
              Commencer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-border bg-card text-foreground font-semibold hover:bg-muted transition-colors text-base"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ H. FOOTER ═══ */}
      <footer className="border-t border-border bg-card/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-10 w-auto object-contain mb-3" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Plateforme IA premium de préparation à l&apos;EAF en Première voie générale.
              </p>
            </div>

            {/* Plateforme */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-3">Plateforme</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#tarifs" className="hover:text-foreground transition-colors">Tarifs</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-3">Légal & sécurité</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-default">Mentions légales</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">Politique de confidentialité (RGPD)</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">CGU</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">Gestion des cookies</span></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-default">Support : contact@nexusreussite.academy</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">Signaler un bug</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Nexus Réussite. Tous droits réservés.
            </p>
            <p className="text-xs text-muted-foreground">
              Pas de publicité ciblée sur les comptes mineurs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
