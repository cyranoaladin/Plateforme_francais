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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

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

const CLASS_LEVELS = [
  'Première générale',
  'Première technologique',
  'Première STMG',
  'Première ST2S',
  'Première STI2D',
  'Première STL',
];

const CLASS_LEVEL_OPTIONS = CLASS_LEVELS.map((level) => ({ value: level, label: level }));

const SKILLS = [
  { key: 'comprehension', label: 'Compréhension du texte', icon: BookOpen, color: 'text-[var(--gold-muted)]' },
  { key: 'procedes', label: 'Analyse des procédés', icon: PenTool, color: 'text-[var(--navy)]' },
  { key: 'plan', label: 'Organisation du plan', icon: PenTool, color: 'text-[var(--teal)]' },
  { key: 'lecture', label: 'Lecture expressive', icon: Mic, color: 'text-[var(--accent-violet)]' },
  { key: 'grammaire', label: 'Grammaire', icon: BrainCircuit, color: 'text-[var(--teal)]' },
  { key: 'culture', label: 'Culture / œuvre & parcours', icon: BookOpen, color: 'text-[var(--navy)]' },
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
                  isActive || isDone ? 'bg-[var(--surface-cream)] text-[var(--navy)]' : 'bg-white/10 text-white/60'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : stepNum}
              </div>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${isActive || isDone ? 'text-[var(--border-warm)]' : 'text-white/45'}`}>
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
    <div className="mb-6 rounded-[22px] border border-[var(--error-muted)]/25 bg-[var(--error-bg)] p-4 text-sm text-[var(--error-dark)]" role="alert">
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
  const [classLevel, setClassLevel] = useState('Première générale');
  const [establishment, setEstablishment] = useState('');
  const [eafDate, setEafDate] = useState('');
  const [selectedOeuvres, setSelectedOeuvres] = useState<string[]>([]);
  const [customOeuvre, setCustomOeuvre] = useState('');
  const [oeuvreSearch, setOeuvreSearch] = useState('');
  const [classCode, setClassCode] = useState('');
  const [oeuvreEntretien, setOeuvreEntretien] = useState('');
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

  const saveProfile = useCallback(async () => {
    try {
      await apiFetch('/api/v1/student/profile', {
        method: 'PUT',
        json: {
          displayName,
          classLevel,
          establishment: establishment || undefined,
          eafDate,
          selectedOeuvres: allSelectedOeuvres,
          weakSkills: weakSignals,
          classCode: classCode || undefined,
        },
      });
    } catch (err) {
      if (isApiError(err) && err.status === 403) {
        setError('Sécurité : rafraîchis la page puis réessaie.');
        return false;
      }
      console.warn('[onboarding] autosave failed:', err);
    }
    return true;
  }, [allSelectedOeuvres, classCode, classLevel, displayName, eafDate, establishment, weakSignals]);

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
          establishment: establishment || undefined,
          eafDate,
          selectedOeuvres: allSelectedOeuvres,
          weakSignals,
          classCode: classCode || undefined,
          oeuvreChoisieEntretien: oeuvreEntretien || undefined,
        },
      });

      track({ name: 'onboarding_complete', props: {} });
      setWelcomeMessage(payload.welcomeMessage ?? 'Ton parcours est prêt.');
      setTimeout(() => {
        router.push('/dashboard');
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
        setError('Impossible de finaliser l’onboarding. Réessaie.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const step1Valid = displayName.trim().length > 0 && classLevel.trim().length > 0 && eafDate.length > 0;
  const step2Valid = allSelectedOeuvres.length > 0;
  const canProceed = (step === 1 && step1Valid) || (step === 2 && step2Valid) || step === 3;
  const currentMeta = STEP_META[step];

  return (
    <div className="min-h-dvh overflow-x-clip bg-[var(--surface-cream)] text-[var(--text-heading)] [background-image:radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(184,115,51,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,239,229,1))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_center_top,rgba(255,255,255,0.9),transparent_65%)]" />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-[var(--teal)]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-[34rem] h-72 w-72 rounded-full bg-[var(--gold-muted)]/10 blur-3xl" />

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-5 rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)]/80 px-5 py-4 shadow-[var(--shadow-md)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-11 w-auto object-contain" />
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-warm)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--navy)]">
              <span className="h-2 w-2 rounded-full bg-[var(--teal)]" />
              Onboarding 2026
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--text-secondary)]">
            <Link href="/" className="rounded-full px-4 py-2 transition-colors hover:text-[var(--navy)]">
              Revoir l{'’'}accueil
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--navy)] px-4 py-2 text-[var(--surface-parchment)]">
              <Clock3 className="h-4 w-4" />
              Environ 3 minutes
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[24px] border border-white/10 bg-[var(--navy)] p-6 text-[var(--surface-parchment)] shadow-[var(--shadow-xl)] md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--border-warm)]">
                <Sparkles className="h-4 w-4" />
                Mise en route
              </div>

              <h1 style={EDITORIAL_HEADING} className="mt-6 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl">
                Nous réglons la plateforme autour de ton vrai contexte.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-slate-200">
                L’objectif n’est pas de remplir un profil pour la forme. L’objectif est de caler les premiers ateliers sur tes œuvres, ton rythme,
                tes points d’appui et les attendus officiels dès la première connexion.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {['Modifiable plus tard', 'Parcours personnalisé', 'Aucune configuration inutile'].map((item) => (
                  <span key={item} className="rounded-full border border-white/12 bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-slate-100">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8">
                <StepRail current={step} />
              </div>

              <div className="mt-8 rounded-[24px] bg-[var(--navy-dark)] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--border-warm)]">Ce que Nexus a déjà compris</p>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  <div className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/6 px-4 py-3">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[var(--border-warm)]" />
                    <div>
                      <p className="font-semibold text-white">Profil</p>
                      <p className="mt-1 leading-6">{displayName.trim() || 'Nom affiché à renseigner'} · {classLevel || 'Classe à confirmer'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/6 px-4 py-3">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[var(--border-warm)]" />
                    <div>
                      <p className="font-semibold text-white">Corpus</p>
                      <p className="mt-1 leading-6">
                        {allSelectedOeuvres.length > 0
                          ? `${allSelectedOeuvres.length} œuvre(s) et parcours déjà pris en compte`
                          : 'Aucune œuvre du programme sélectionnée pour l’instant'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/6 px-4 py-3">
                    <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-[var(--border-warm)]" />
                    <div>
                      <p className="font-semibold text-white">Priorités</p>
                      <p className="mt-1 leading-6">
                        {weakSignals.length > 0 ? weakSignals.join(', ') : 'Aucune faiblesse auto-déclarée forte à ce stade'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/8 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--border-warm)]" />
                  <p className="text-sm leading-6 text-slate-200">
                    Les informations saisies ici servent à cadrer les premières recommandations, les ressources mobilisées et la progression visible.
                    Elles restent modifiables ensuite dans le profil.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)]/88 p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-9">
            {error ? <OnboardingErrorBanner message={error} /> : null}
            {welcomeMessage ? (
              <div className="mb-6 flex items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--teal)]/25 bg-[var(--success-bg)] p-4 text-sm text-[var(--teal)]" role="status">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {welcomeMessage}
              </div>
            ) : null}

            <div className="border-b border-[var(--border-sand)] pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--teal)]">{currentMeta.kicker}</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl">
                {currentMeta.title}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{currentMeta.description}</p>
              <div className="mt-4 rounded-[22px] border border-[var(--border-strong)] bg-[var(--surface-warm)] px-4 py-3 text-sm text-[var(--text-secondary)]">
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
                      size="lg"
                      className="md:col-span-2"
                    />

                    <Select
                      label="Classe"
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      options={CLASS_LEVEL_OPTIONS}
                      size="lg"
                    />

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
                      label="Établissement"
                      value={establishment}
                      onChange={(e) => setEstablishment(e.target.value)}
                      placeholder="Nom de ton lycée"
                      size="lg"
                    />

                    <Input
                      label="Code classe enseignant"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                      placeholder="Ex : PMF-1G2-2026"
                      size="lg"
                    />
                  </div>

                  <Card variant="default" className="rounded-[24px] border-[var(--border-strong)] bg-[var(--surface-warm)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Prévisualisation</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Nom</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--navy)]">{displayName.trim() || 'À renseigner'}</p>
                      </div>
                      <div className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Classe</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--navy)]">{classLevel}</p>
                      </div>
                      <div className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--card)] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Échéance</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--navy)]">{formatDateLabel(eafDate)}</p>
                      </div>
                    </div>
                  </Card>
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
                    <Card variant="default" className="rounded-[24px] border-[var(--border-strong)] bg-[var(--surface-warm)]" padding="sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Sélection en cours</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {allSelectedOeuvres.map((oeuvre) => (
                          <span key={oeuvre} className="rounded-full border border-[var(--border-strong)] bg-[var(--card)] px-3.5 py-1.5 text-xs font-semibold text-[var(--navy)]">
                            {oeuvre}
                          </span>
                        ))}
                      </div>
                    </Card>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredOeuvres.map((oeuvre) => {
                      const isSelected = selectedOeuvres.includes(oeuvre.title);

                      return (
                        <button
                          type="button"
                          key={oeuvre.id}
                          onClick={() => toggleOeuvre(oeuvre.title)}
                          className={`rounded-[var(--radius-xl)] border p-4 text-left transition-all duration-[var(--transition-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)] ${
                            isSelected
                              ? 'border-[var(--navy)] bg-[var(--navy)] text-[var(--surface-parchment)] shadow-[var(--shadow-lg)]'
                              : 'border-[var(--border-strong)] bg-[var(--card)] hover:-translate-y-0.5 hover:border-[var(--teal)] hover:shadow-[var(--shadow-sm)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${isSelected ? 'text-[var(--border-warm)]' : 'text-[var(--text-muted)]'}`}>
                                {oeuvre.type}
                              </p>
                              <p className="mt-2 text-sm font-bold leading-6">{oeuvre.title}</p>
                              <p className={`mt-1 text-sm ${isSelected ? 'text-slate-200' : 'text-[var(--text-secondary)]'}`}>{oeuvre.author}</p>
                            </div>
                            <div className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${isSelected ? 'border-white bg-white text-[var(--navy)]' : 'border-[var(--border-strong)] text-transparent'}`}>
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
                    <div className="rounded-[24px] border border-[var(--teal)]/20 bg-[var(--teal)]/5 p-5">
                      <p className="text-sm font-semibold text-[var(--navy)]">Ton œuvre d{'’'}entretien oral</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">Œuvre intégrale pour la 2e partie de l{'’'}oral (8 points sur 20).</p>
                      <div className="mt-3 space-y-2">
                        {allSelectedOeuvres.map((title) => {
                          const found = OEUVRES.find((o) => o.title === title);
                          const authorName = found?.author ?? '';
                          return (
                            <label
                              key={'entretien-' + title}
                              className={'flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors ' + (
                                oeuvreEntretien === title
                                  ? 'border-[var(--teal)] bg-[var(--teal)]/10'
                                  : 'border-[var(--border-strong)] bg-[var(--card)] hover:border-[var(--teal)]/40'
                              )}
                            >
                              <input
                                type="radio"
                                name="oeuvreEntretien"
                                value={title}
                                checked={oeuvreEntretien === title}
                                onChange={() => setOeuvreEntretien(title)}
                                className="accent-[var(--teal)]"
                              />
                              <span className="text-sm font-medium text-[var(--navy)]">{title}</span>
                              {authorName && <span className="text-xs text-[var(--text-placeholder)]">{authorName}</span>}
                            </label>
                          );
                        })}
                      </div>
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
                      <Card key={skill.key} variant="default" className="rounded-[24px] border-[var(--border-strong)] bg-[var(--surface-warm)]" padding="md">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--card)] text-[var(--navy)] shadow-sm">
                              <Icon className={`h-5 w-5 ${skill.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--navy)]">{skill.label}</p>
                              <p className="text-xs text-[var(--text-muted)]">Réglage initial pour prioriser les prochains ateliers.</p>
                            </div>
                          </div>
                          <div className="rounded-full border border-[var(--border-strong)] bg-[var(--card)] px-3 py-1 text-xs font-bold text-[var(--navy)]">
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
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[var(--surface-sand)] accent-[var(--navy)]"
                            aria-label={`${skill.label} : ${value} sur 5`}
                          />
                          <div className="mt-2 flex justify-between text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                            <span>Fragile</span>
                            <span>Solide</span>
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

            <div className="mt-8 flex items-center justify-between border-t border-[var(--border-sand)] pt-5">
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
