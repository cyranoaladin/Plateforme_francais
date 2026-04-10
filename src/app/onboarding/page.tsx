'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mic,
  PenTool,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api/client';
import { track } from '@/components/analytics/events';
import { Button, Card, Input, Surface } from '@/components/ui';

const OEUVRES = [
  { id: 'douai', title: 'Cahier de Douai', author: 'Arthur Rimbaud', type: 'Poésie' },
  { id: 'ponge', title: 'La Rage de l’expression', author: 'Francis Ponge', type: 'Poésie' },
  { id: 'dorion', title: 'Mes forêts', author: 'Hélène Dorion', type: 'Poésie' },
  { id: 'boetie', title: 'Discours de la servitude volontaire', author: 'Étienne de La Boétie', type: 'Littérature d’idées' },
  { id: 'fontenelle', title: 'Entretiens sur la pluralité des mondes', author: 'Fontenelle', type: 'Littérature d’idées' },
  { id: 'graffigny', title: 'Lettres d’une Péruvienne', author: 'Françoise de Graffigny', type: 'Littérature d’idées' },
  { id: 'menteur', title: 'Le Menteur', author: 'Pierre Corneille', type: 'Théâtre' },
  { id: 'musset', title: 'On ne badine pas avec l’amour', author: 'Alfred de Musset', type: 'Théâtre' },
  { id: 'sarraute', title: 'Pour un oui ou pour un non', author: 'Nathalie Sarraute', type: 'Théâtre' },
  { id: 'prevost', title: 'Manon Lescaut', author: 'Abbé Prévost', type: 'Roman' },
  { id: 'peau', title: 'La Peau de chagrin', author: 'Honoré de Balzac', type: 'Roman' },
  { id: 'sido', title: 'Sido / Les Vrilles de la vigne', author: 'Colette', type: 'Roman' },
];

type Voie = 'GENERALE' | 'TECHNOLOGIQUE';

const VOIE_OPTIONS = [
  { value: 'GENERALE' as const, label: 'Première générale' },
  { value: 'TECHNOLOGIQUE' as const, label: 'Première technologique' },
];

const SKILLS = [
  { key: 'comprehension', label: 'Compréhension du texte', icon: BookOpen, color: 'text-[var(--color-amber-300)]' },
  { key: 'procedes', label: 'Analyse des procédés', icon: PenTool, color: 'text-[var(--c-primary)]' },
  { key: 'plan', label: 'Organisation du plan', icon: PenTool, color: 'text-[var(--c-success)]' },
  { key: 'lecture', label: 'Lecture expressive', icon: Mic, color: 'text-[var(--c-primary)]' },
  { key: 'grammaire', label: 'Grammaire', icon: BrainCircuit, color: 'text-[var(--c-success)]' },
  { key: 'culture', label: 'Culture / œuvre & parcours', icon: BookOpen, color: 'text-[var(--c-primary)]' },
] as const;

const STEP_LABELS = ['Profil', 'Œuvres', 'Auto-évaluation'] as const;

const STEP_META = {
  1: {
    kicker: 'Étape 1',
    title: 'Installe le contexte réel de travail.',
    description:
      'Nom affiché, classe, date EAF, établissement et code enseignant éventuel : on règle d’abord le terrain, pas l’interface.',
    benefit: 'Ces données servent à personnaliser le parcours dès la première séance.',
  },
  2: {
    kicker: 'Étape 2',
    title: 'Rattache le produit à tes œuvres réelles.',
    description:
      'Le corpus et les relances ont plus de valeur si les œuvres étudiées sont connues dès le départ.',
    benefit: 'Tu peux sélectionner les œuvres officielles et ajouter une œuvre absente si besoin.',
  },
  3: {
    kicker: 'Étape 3',
    title: 'Calibre le point de départ sans te juger.',
    description:
      'Cette auto-évaluation ne remplace pas un diagnostic. Elle permet juste d’éviter un premier parcours mal ciblé.',
    benefit: 'Les axes faibles déclarés seront utilisés pour prioriser les prochains ateliers.',
  },
} satisfies Record<1 | 2 | 3, { kicker: string; title: string; description: string; benefit: string }>;

function StepRail({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Étapes de l’onboarding" className="space-y-3">
      {STEP_LABELS.map((label, idx) => {
        const stepNum = (idx + 1) as 1 | 2 | 3;
        const isActive = stepNum === current;
        const isDone = stepNum < current;

        return (
          <div
            key={label}
            className={`rounded-[22px] border px-4 py-4 transition-colors ${
              isActive
                ? 'border-white/14 bg-white/12'
                : isDone
                  ? 'border-white/10 bg-black/10'
                  : 'border-white/8 bg-white/5'
            }`}
            aria-current={isActive ? 'step' : undefined}
          >
            <div className="flex items-center gap-3">
              <div
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isActive || isDone ? 'bg-[var(--bg-surface-secondary)] text-[var(--c-primary)]' : 'bg-white/10 text-white/60'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : stepNum}
              </div>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${isActive || isDone ? 'text-[var(--color-amber-300)]' : 'text-white/45'}`}>
                  {`0${stepNum}`}
                </p>
                <p className={`text-sm font-semibold ${isActive || isDone ? 'text-white' : 'text-white/65'}`}>{label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function OnboardingErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-[22px] border border-[var(--c-accent-text)]/25 bg-[var(--c-accent-subtle)] p-4 text-sm text-[var(--c-accent-text)]" role="alert">
      {message}
    </div>
  );
}

function formatDateLabel(date: string) {
  if (!date) return 'À renseigner';
  try {
    return new Date(date).toLocaleDateString('fr-FR');
  } catch {
    return date;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState('');
  const [voie, setVoie] = useState<Voie>('GENERALE');
  const [lecturesCursives, setLecturesCursives] = useState<string[]>([]);
  const [cursiveInput, setCursiveInput] = useState('');
  const [establishment, setEstablishment] = useState('');
  const [eafDate, setEafDate] = useState('');
  const [selectedOeuvres, setSelectedOeuvres] = useState<string[]>([]);
  const [customOeuvre, setCustomOeuvre] = useState('');
  const [oeuvreSearch, setOeuvreSearch] = useState('');
  const [classCode, setClassCode] = useState('');
  const [oeuvresEntretien, setOeuvresEntretien] = useState<string[]>([]);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ratings, setRatings] = useState<Record<string, number>>({
    comprehension: 3,
    procedes: 3,
    plan: 3,
    lecture: 3,
    grammaire: 3,
    culture: 3,
  });

  const weakSignals = useMemo(
    () =>
      Object.entries(ratings)
        .filter(([, value]) => value <= 2)
        .map(([key]) => {
          const skill = SKILLS.find((item) => item.key === key);
          return skill?.label ?? key;
        }),
    [ratings],
  );

  const filteredOeuvres = useMemo(() => {
    if (!oeuvreSearch.trim()) return OEUVRES;
    const query = oeuvreSearch.toLowerCase();
    return OEUVRES.filter(
      (oeuvre) =>
        oeuvre.title.toLowerCase().includes(query) ||
        oeuvre.author.toLowerCase().includes(query) ||
        oeuvre.type.toLowerCase().includes(query),
    );
  }, [oeuvreSearch]);

  const allSelectedOeuvres = useMemo(() => {
    return customOeuvre.trim() ? [...selectedOeuvres, customOeuvre.trim()] : selectedOeuvres;
  }, [customOeuvre, selectedOeuvres]);

  useEffect(() => {
    track({ name: 'page_view', props: { path: '/onboarding' } });
  }, []);

  useEffect(() => {
    track({ name: 'onboarding_step_view', props: { step } });
  }, [step]);

  const toggleOeuvre = (title: string) => {
    setSelectedOeuvres((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]));
  };

  const classLevel = voie === 'TECHNOLOGIQUE' ? 'Première technologique' : 'Première générale';

  const saveProfile = useCallback(async () => {
    try {
      console.log('[onboarding] saveProfile payload:', {
        displayName,
        classLevel,
        establishment,
        eafDate,
        selectedOeuvres: allSelectedOeuvres,
        weakSignals,
        classCode,
      });
      
      await apiFetch('/api/v1/student/profile', {
        method: 'PUT',
        json: {
          displayName,
          classLevel,
          voie,
          establishment: establishment || undefined,
          eafDate,
          selectedOeuvres: allSelectedOeuvres,
          weakSkills: weakSignals, // weakSignals -> weakSkills (schema mismatch)
          classCode: classCode || undefined,
          lecturesCursives: lecturesCursives.length > 0 ? lecturesCursives : undefined,
        },
      });
      
      console.log('[onboarding] saveProfile success');
    } catch (err) {
      console.error('[onboarding] saveProfile failed:', err);
      if (isApiError(err)) {
        if (err.status === 403) {
          setError('Sécurité : rafraîchis la page puis réessaie.');
          return false;
        }
        if (err.status === 400) {
          setError('Données invalides. Vérifie tous les champs.');
          return false;
        }
        setError(err.message || 'Erreur technique. Réessaie plus tard.');
        return false;
      }
      console.warn('[onboarding] autosave failed:', err);
      return false;
    }
    return true;
  }, [allSelectedOeuvres, classCode, classLevel, voie, displayName, eafDate, establishment, weakSignals, lecturesCursives]);

  const handleNext = async () => {
    setError(null);
    setIsSubmitting(true);
    track({ name: 'onboarding_step_submit', props: { step } });

    const saved = await saveProfile();
    setIsSubmitting(false);
    if (!saved) return;

    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handleFinish = async () => {
    setError(null);
    setIsSubmitting(true);
    track({ name: 'onboarding_step_submit', props: { step: 3 } });

    const saved = await saveProfile();
    if (!saved) {
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = await apiFetch<{ welcomeMessage?: string }>('/api/v1/onboarding/complete', {
        method: 'POST',
        json: {
          displayName,
          classLevel,
          voie,
          establishment: establishment || undefined,
          eafDate,
          selectedOeuvres: allSelectedOeuvres,
          weakSignals,
          classCode: classCode || undefined,
          oeuvreChoisieEntretien: oeuvresEntretien[0] || undefined,
          oeuvresEntretien: oeuvresEntretien.length > 0 ? oeuvresEntretien : undefined,
          lecturesCursives: lecturesCursives.length > 0 ? lecturesCursives : undefined,
        },
      });

      track({ name: 'onboarding_complete', props: {} });
      setWelcomeMessage(payload.welcomeMessage ?? 'Ton parcours est prêt. Complète ton descriptif de lecture pour simuler l\'épreuve orale dans les conditions réelles !');
      setTimeout(() => {
        router.push('/descriptif-lecture?onboarding=true');
        router.refresh();
      }, 1200);
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 403) {
          setError('Sécurité : rafraîchis la page puis réessaie.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Impossible de finaliser la configuration. Réessaie.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const step1Valid = displayName.trim().length > 0 && eafDate.length > 0;
  const step2Valid = allSelectedOeuvres.length > 0;
  const canProceed = (step === 1 && step1Valid) || (step === 2 && step2Valid) || step === 3;
  const currentMeta = STEP_META[step];

  return (
    <div className="min-h-dvh overflow-x-clip bg-[var(--bg-surface-secondary)] text-[var(--text-heading)] [background-image:radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(184,115,51,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,239,229,1))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_center_top,rgba(255,255,255,0.9),transparent_65%)]" />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-[var(--c-success)]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-[34rem] h-72 w-72 rounded-full bg-[var(--color-amber-300)]/10 blur-3xl" />

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-5 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/80 px-5 py-4 shadow-[var(--shadow-md)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-11 w-auto object-contain" />
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--c-primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--c-success)]" />
              Configuration du parcours
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--text-secondary)]">
            <Link href="/" className="rounded-full px-4 py-2 transition-colors hover:text-[var(--c-primary)]">
              Revoir l’accueil
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--c-primary)] px-4 py-2 text-[var(--text-on-primary)]">
              <Clock3 className="h-4 w-4" />
              Environ 3 minutes
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="hero-premium-panel rounded-[24px] p-6 md:p-8">
              <div className="hero-kicker">
                <Sparkles className="h-4 w-4" />
                Mise en route
              </div>

              <h1 className="editorial-heading mt-6 text-4xl text-white sm:text-5xl">
                Nous réglons la plateforme autour de ton vrai contexte.
              </h1>

              <p className="hero-body mt-5 max-w-xl text-base leading-8">
                L’objectif n’est pas de remplir un profil pour la forme. L’objectif est de caler les premiers ateliers sur tes œuvres, ton rythme,
                tes points d’appui et les attendus officiels dès la première connexion.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {['Modifiable plus tard', 'Parcours personnalisé', 'Aucune configuration inutile'].map((item) => (
                  <span key={item} className="hero-chip px-3.5 py-1.5 text-xs font-semibold text-[var(--hero-glass-text)]">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8">
                <StepRail current={step} />
              </div>

              <div className="hero-glass-card-strong mt-8 rounded-[24px] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--hero-kicker-text)]">Ce que Nexus a déjà compris</p>
                <div className="hero-body mt-4 space-y-3 text-sm">
                  <div className="hero-glass-card rounded-[22px] px-4 py-3">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-amber-300)]" />
                    <div>
                      <p className="font-semibold text-white">Profil</p>
                      <p className="mt-1 leading-6">{displayName.trim() || 'Nom affiché à renseigner'} · {classLevel || 'Classe à confirmer'}</p>
                    </div>
                  </div>
                  <div className="hero-glass-card rounded-[22px] px-4 py-3">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-amber-300)]" />
                    <div>
                      <p className="font-semibold text-white">Corpus</p>
                      <p className="mt-1 leading-6">
                        {allSelectedOeuvres.length > 0
                          ? `${allSelectedOeuvres.length} œuvre(s) et parcours déjà pris en compte`
                          : 'Aucune œuvre du programme sélectionnée pour l’instant'}
                      </p>
                    </div>
                  </div>
                  <div className="hero-glass-card rounded-[22px] px-4 py-3">
                    <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-amber-300)]" />
                    <div>
                      <p className="font-semibold text-white">Priorités</p>
                      <p className="mt-1 leading-6">
                        {weakSignals.length > 0 ? weakSignals.join(', ') : 'Aucune faiblesse auto-déclarée forte à ce stade'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-glass-card mt-6 rounded-[24px] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-amber-300)]" />
                  <p className="hero-body text-sm leading-6">
                    Les informations saisies ici servent à cadrer les premières recommandations, les ressources mobilisées et la progression visible.
                    Elles restent modifiables ensuite dans le profil.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/88 p-6 shadow-[var(--shadow-md)] sm:p-8 lg:p-9">
            {error ? <OnboardingErrorBanner message={error} /> : null}
            {welcomeMessage ? (
              <div className="mb-6 flex items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--c-success)]/25 bg-[var(--bg-success)] p-4 text-sm text-[var(--c-success)]" role="status">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {welcomeMessage}
              </div>
            ) : null}

            <div className="border-b border-[var(--border-default)] pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">{currentMeta.kicker}</p>
              <h2 className="editorial-heading mt-4 text-4xl text-[var(--c-primary)] sm:text-5xl">
                {currentMeta.title}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{currentMeta.description}</p>
              <div className="mt-4 rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                {currentMeta.benefit}
              </div>
            </div>

            <div className="mt-6">
              {step === 1 ? (
                <div className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
                    <Input
                      id="ob-name"
                      label="Nom affiché"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Comment veux-tu apparaître dans la plateforme ?"
                      required
                      autoComplete="name"
                      size="lg"
                      className="md:col-span-2"
                    />

                    <div>
                      <p className="mb-2 text-sm font-semibold text-[var(--c-primary)]">Voie</p>
                      <div className="flex gap-2">
                        {VOIE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setVoie(opt.value); setSelectedOeuvres([]); setOeuvresEntretien([]); }}
                            className={`flex-1 rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-semibold transition-all ${
                              voie === opt.value
                                ? 'border-[var(--c-success)] bg-[var(--c-success)]/10 text-[var(--c-primary)]'
                                : 'border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--c-success)]/40'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Input
                      id="ob-date"
                      label="Date EAF"
                      type="date"
                      value={eafDate}
                      onChange={(e) => setEafDate(e.target.value)}
                      required
                      size="lg"
                    />

                    <Input
                      label="Établissement (facultatif)"
                      value={establishment}
                      onChange={(e) => setEstablishment(e.target.value)}
                      placeholder="Nom de ton lycée"
                      autoComplete="organization"
                      size="lg"
                    />

                    <Input
                      label="Code classe enseignant (facultatif)"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                      placeholder="Fourni par ton enseignant, sinon laisse vide"
                      size="lg"
                    />
                  </div>

                  <Surface tone="subtle" padding="md">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Prévisualisation</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Nom</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--c-primary)]">{displayName.trim() || 'À renseigner'}</p>
                      </div>
                      <div className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Voie</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--c-primary)]">{classLevel}</p>
                      </div>
                      <div className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Échéance</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--c-primary)]">{formatDateLabel(eafDate)}</p>
                      </div>
                    </div>
                  </Surface>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <Input
                    value={oeuvreSearch}
                    onChange={(e) => setOeuvreSearch(e.target.value)}
                    placeholder="Rechercher une œuvre, un auteur, un objet d’étude..."
                    icon={<Search className="h-4 w-4" />}
                    size="lg"
                  />

                  {allSelectedOeuvres.length > 0 ? (
                    <Surface tone="subtle" padding="sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Sélection en cours</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {allSelectedOeuvres.map((oeuvre) => (
                          <span key={oeuvre} className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--c-primary)]">
                            {oeuvre}
                          </span>
                        ))}
                      </div>
                    </Surface>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredOeuvres.map((oeuvre) => {
                      const isSelected = selectedOeuvres.includes(oeuvre.title);

                      return (
                        <button
                          type="button"
                          key={oeuvre.id}
                          onClick={() => toggleOeuvre(oeuvre.title)}
                          className={`rounded-[var(--radius-xl)] border p-4 text-left transition-all duration-[var(--transition-normal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c-success)] ${
                            isSelected
                              ? 'border-[var(--c-primary)] bg-[var(--c-primary)] text-[var(--bg-page)] shadow-[var(--shadow-md)]'
                              : 'border-[var(--border-strong)] bg-[var(--bg-surface)] hover:-translate-y-0.5 hover:border-[var(--c-success)] hover:shadow-[var(--shadow-sm)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${isSelected ? 'text-[var(--color-amber-300)]' : 'text-[var(--text-muted)]'}`}>
                                {oeuvre.type}
                              </p>
                              <p className="mt-2 text-sm font-bold leading-6">{oeuvre.title}</p>
                              <p className={`mt-1 text-sm ${isSelected ? 'text-slate-200' : 'text-[var(--text-secondary)]'}`}>{oeuvre.author}</p>
                            </div>
                            <div className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${isSelected ? 'border-white bg-white text-[var(--c-primary)]' : 'border-[var(--border-strong)] text-transparent'}`}>
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <Input
                    label="Œuvre absente de la liste"
                    value={customOeuvre}
                    onChange={(e) => setCustomOeuvre(e.target.value)}
                    placeholder={"Saisis exactement l\u2019œuvre donnée par ton professeur"}
                    size="lg"
                  />

                  {allSelectedOeuvres.length > 0 && (
                    <div className="rounded-[24px] border border-[var(--c-success)]/20 bg-[var(--c-success)]/5 p-5">
                      <p className="text-sm font-semibold text-[var(--c-primary)]">{"Tes œuvres pour l\u2019entretien oral"}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{"Coche les œuvres que tu souhaites travailler pour la 2e partie de l\u2019oral (8 pts/20). La première cochée sera ton œuvre principale."}</p>
                      <div className="mt-3 space-y-2">
                        {allSelectedOeuvres.map((title) => {
                          const found = OEUVRES.find((o) => o.title === title);
                          const authorName = found?.author ?? '';
                          const isChecked = oeuvresEntretien.includes(title);
                          const isPrimary = oeuvresEntretien[0] === title;
                          return (
                            <label
                              key={'entretien-' + title}
                              className={'flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors ' + (
                                isChecked
                                  ? 'border-[var(--c-success)] bg-[var(--c-success)]/10'
                                  : 'border-[var(--border-strong)] bg-[var(--bg-surface)] hover:border-[var(--c-success)]/40'
                              )}
                            >
                              <input
                                type="checkbox"
                                value={title}
                                checked={isChecked}
                                onChange={() => {
                                  setOeuvresEntretien((prev) =>
                                    prev.includes(title)
                                      ? prev.filter((o) => o !== title)
                                      : [...prev, title],
                                  );
                                }}
                                className="accent-[var(--c-success)]"
                              />
                              <span className="text-sm font-medium text-[var(--c-primary)]">{title}</span>
                              {authorName && <span className="text-xs text-[var(--text-muted)]">{authorName}</span>}
                              {isPrimary && <span className="ml-auto rounded-full bg-[var(--c-success)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--c-success)]">Principale</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {allSelectedOeuvres.length > 0 && (
                    <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-5">
                      <p className="text-sm font-semibold text-[var(--c-primary)]">Lectures cursives pour l&apos;entretien</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">Ajoute tes lectures cursives personnelles (jusqu&apos;à 10). Elles seront mobilisables pour la 2e partie de l&apos;oral.</p>
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={cursiveInput}
                          onChange={(e) => setCursiveInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && cursiveInput.trim() && lecturesCursives.length < 10) {
                              e.preventDefault();
                              setLecturesCursives((prev) => [...prev, cursiveInput.trim()]);
                              setCursiveInput('');
                            }
                          }}
                          placeholder="Ex : L'Étranger — Albert Camus"
                          className="flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--c-primary)] outline-none focus:border-[var(--c-success)] focus:ring-2 focus:ring-[var(--c-success)]/20"
                        />
                        <button
                          type="button"
                          disabled={!cursiveInput.trim() || lecturesCursives.length >= 10}
                          onClick={() => {
                            if (cursiveInput.trim() && lecturesCursives.length < 10) {
                              setLecturesCursives((prev) => [...prev, cursiveInput.trim()]);
                              setCursiveInput('');
                            }
                          }}
                          className="rounded-xl bg-[var(--c-success)] px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
                        >
                          Ajouter
                        </button>
                      </div>
                      {lecturesCursives.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {lecturesCursives.map((lc, i) => (
                            <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--c-primary)]">
                              <span>{lc}</span>
                              <button
                                type="button"
                                onClick={() => setLecturesCursives((prev) => prev.filter((_, idx) => idx !== i))}
                                className="text-xs text-[var(--text-muted)] hover:text-[var(--c-accent-text)]"
                              >
                                Retirer
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  {SKILLS.map((skill) => {
                    const Icon = skill.icon;
                    const value = ratings[skill.key];

                    return (
                      <Card key={skill.key} variant="default" className="rounded-[24px] border-[var(--border-strong)] bg-[var(--bg-surface-secondary)]" padding="md">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--bg-surface)] text-[var(--c-primary)] shadow-sm">
                              <Icon className={`h-5 w-5 ${skill.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--c-primary)]">{skill.label}</p>
                              <p className="text-xs text-[var(--text-muted)]">Réglage initial pour prioriser les prochains ateliers.</p>
                            </div>
                          </div>
                          <div className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-bold text-[var(--c-primary)]">
                            {value} / 5
                          </div>
                        </div>
                        <div className="mt-4">
                          <input
                            type="range"
                            min={0}
                            max={5}
                            value={value}
                            onChange={(e) => setRatings((prev) => ({ ...prev, [skill.key]: Number(e.target.value) }))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[var(--border-default)] accent-[var(--c-primary)]"
                            aria-label={`${skill.label} : ${value} sur 5`}
                          />
                          <div className="mt-2 flex justify-between text-[11px] font-medium tracking-[0.12em] text-[var(--text-muted)]">
                            <span>0 — Pas vu</span>
                            <span>1</span>
                            <span>2</span>
                            <span>3</span>
                            <span>4</span>
                            <span>5 — Solide</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}

                  <Card variant="default" className="rounded-[24px] border-[var(--border-strong)]" padding="md">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Priorisation détectée</p>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                      {weakSignals.length > 0
                        ? `Le parcours mettra d’abord l’accent sur : ${weakSignals.join(', ')}.`
                        : 'Aucune faiblesse forte auto-déclarée. Le parcours pourra commencer sur une base plus équilibrée.'}
                    </p>
                  </Card>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-[var(--border-default)] pt-5">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  icon={<ChevronLeft className="h-4 w-4" />}
                  iconPosition="left"
                >
                  Retour
                </Button>
              ) : (
                <div className="text-xs text-[var(--text-muted)]">Étape {step} sur 3</div>
              )}

              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={() => {
                  if (step < 3) void handleNext();
                  else void handleFinish();
                }}
                disabled={!canProceed || isSubmitting}
                loading={isSubmitting}
                icon={step < 3 ? <ChevronRight className="h-4 w-4" /> : undefined}
                iconPosition="right"
              >
                {isSubmitting ? 'Enregistrement...' : step === 3 ? 'Terminer' : 'Continuer'}
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
