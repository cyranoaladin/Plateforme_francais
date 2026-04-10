'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Flame,
  Mic,
  PenTool,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import { ensurePublicCsrfToken } from '@/lib/security/csrf-client';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';
import { Card, Badge, Button, Input, Select } from '@/components/ui';
import { StateNotice } from '@/components/ui';

type StudentProfile = {
  classLevel?: string;
  targetScore?: string;
  establishment?: string;
  parentEmail?: string | null;
  teacherEmail?: string | null;
  skillMap: {
    ecrit: number | null;
    oral: number | null;
    grammaire: number | null;
    lectureCursive: number | null;
    lastUpdated: string | null;
  };
  errorBank: Array<{
    type: string;
    description: string;
    count: number;
    firstSeen: string;
  }>;
  studyPlan: {
    tasks: Array<{
      id: string;
      description: string;
      dueDate: string;
      estimatedMinutes: number;
      skill: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  badges: string[];
  streak: number;
  totalSessions: number;
  totalCopies: number;
  displayName?: string;
  selectedOeuvres?: string[];
  oeuvreChoisieEntretien?: string;
  hasEvaluationData?: boolean;
};

type EditableProfileFields = {
  displayName: string;
  classLevel: string;
  targetScore: string;
  establishment: string;
  parentEmail: string;
  teacherEmail: string;
};

type SaveFeedback =
  | {
      tone: 'success' | 'error';
      message: string;
    }
  | null;

const FALLBACK_PROFILE: StudentProfile = {
  skillMap: {
    ecrit: null,
    oral: null,
    grammaire: null,
    lectureCursive: null,
    lastUpdated: null,
  },
  errorBank: [],
  studyPlan: {
    tasks: [],
  },
  badges: [],
  streak: 0,
  totalSessions: 0,
  totalCopies: 0,
  displayName: 'Élève',
  selectedOeuvres: [],
  hasEvaluationData: false,
};

const SKILL_META = [
  {
    key: 'ecrit' as const,
    label: 'Écrit',
    accent: 'bg-[var(--c-primary)]',
    copy: 'Construire plus vite une réponse solide, sans perdre la tension du sujet.',
    icon: PenTool,
  },
  {
    key: 'oral' as const,
    label: 'Oral',
    accent: 'bg-[var(--c-success)]',
    copy: 'Tenir la lecture, l’explication et la relance avec plus de fluidité.',
    icon: Mic,
  },
  {
    key: 'grammaire' as const,
    label: 'Grammaire',
    accent: 'bg-[var(--c-accent)]',
    copy: 'Stabiliser les notions qui font perdre des points trop vite.',
    icon: BrainCircuit,
  },
  {
    key: 'lectureCursive' as const,
    label: 'Lecture cursive',
    accent: 'bg-[var(--c-reward)]',
    copy: 'Garder les œuvres et leurs enjeux disponibles au moment utile.',
    icon: BookOpen,
  },
];

const BADGE_STYLES = [
  'from-[var(--color-indigo-700)] to-[var(--color-indigo-400)]',
  'from-[var(--color-emerald-700)] to-[var(--color-emerald-400)]',
  'from-[var(--color-amber-700)] to-[var(--color-amber-400)]',
  'from-[var(--color-coral-700)] to-[var(--color-coral-400)]',
];

const PRIORITY_STYLE = {
  high: 'border-[var(--border-reward)] bg-[color-mix(in_srgb,var(--color-amber-400)_18%,transparent)] text-[var(--color-amber-200)]',
  medium: 'border-[var(--border-primary)] bg-[color-mix(in_srgb,var(--color-indigo-300)_16%,transparent)] text-[var(--color-indigo-100)]',
  low: 'border-[var(--border-success)] bg-[color-mix(in_srgb,var(--color-emerald-400)_16%,transparent)] text-[var(--color-emerald-100)]',
};

const CLASS_LEVEL_OPTIONS = [
  { value: 'Première générale', label: 'Première générale' },
  { value: 'Première technologique', label: 'Première technologique' },
  { value: 'Première STMG', label: 'Première STMG' },
  { value: 'Première ST2S', label: 'Première ST2S' },
  { value: 'Première STI2D', label: 'Première STI2D' },
  { value: 'Première STL', label: 'Première STL' },
];

function formatShortDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return 'Date à préciser';
  }
  return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function averageScoreValue(scores: StudentProfile['skillMap']) {
  const values = [scores.ecrit, scores.oral, scores.grammaire, scores.lectureCursive].filter(
    (value): value is number => typeof value === 'number',
  );

  if (values.length === 0) {
    return null;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function formatScoreLabel(value: number | null) {
  if (value === null) {
    return 'Diagnostic à lancer';
  }

  return `${value.toFixed(1)} / 20`;
}

function buildEditableProfileFields(profile: StudentProfile): EditableProfileFields {
  return {
    displayName: profile.displayName ?? 'Élève',
    classLevel: profile.classLevel ?? 'Première générale',
    targetScore: profile.targetScore ?? '',
    establishment: profile.establishment ?? '',
    parentEmail: profile.parentEmail ?? '',
    teacherEmail: profile.teacherEmail ?? '',
  };
}

function buildProfileUpdatePayload(fields: EditableProfileFields) {
  const parentEmail = fields.parentEmail.trim();
  const teacherEmail = fields.teacherEmail.trim();
  const targetScore = fields.targetScore.trim();

  return {
    displayName: fields.displayName.trim(),
    classLevel: fields.classLevel.trim(),
    targetScore: targetScore || undefined,
    establishment: fields.establishment.trim(),
    parentEmail: parentEmail ? parentEmail : null,
    teacherEmail: teacherEmail ? teacherEmail : null,
  };
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editableProfile, setEditableProfile] = useState<EditableProfileFields>(
    () => buildEditableProfileFields(FALLBACK_PROFILE),
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/v1/student/profile');
        if (response.status === 401) {
          setProfile(FALLBACK_PROFILE);
          return;
        }
        if (!response.ok) {
          throw new Error('Le chargement du profil a rencontré un problème. Réessaie dans un instant.');
        }

        setProfile((await response.json()) as StudentProfile);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Un problème temporaire empêche le chargement du profil.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    setEditableProfile(buildEditableProfileFields(profile ?? FALLBACK_PROFILE));
  }, [profile]);

  const resolvedProfile = profile ?? FALLBACK_PROFILE;
  const displayName = resolvedProfile.displayName ?? 'Élève';
  const averageScore = averageScoreValue(resolvedProfile.skillMap);
  const hasEvaluationData = resolvedProfile.hasEvaluationData ?? averageScore !== null;

  const skillCards = SKILL_META.map((skill) => ({
    ...skill,
    score: resolvedProfile.skillMap[skill.key],
  }));

  const strongestSkill = skillCards.reduce(
    (prev, current) => ((current.score ?? 0) > (prev.score ?? 0) ? current : prev),
    skillCards[0],
  );
  const weakestSkill = skillCards.reduce(
    (prev, current) => ((current.score ?? 0) < (prev.score ?? 0) ? current : prev),
    skillCards[0],
  );
  const upcomingTasks = resolvedProfile.studyPlan.tasks.slice(0, 3);
  const topErrors = resolvedProfile.errorBank.slice(0, 5);
  const tutorHref = buildTuteurHref({
    workId: resolvedProfile.oeuvreChoisieEntretien ?? resolvedProfile.selectedOeuvres?.[0] ?? null,
  });
  const classLevelOptions = useMemo(() => {
    const currentClassLevel = editableProfile.classLevel.trim();
    if (
      currentClassLevel.length > 0
      && !CLASS_LEVEL_OPTIONS.some((option) => option.value === currentClassLevel)
    ) {
      return [{ value: currentClassLevel, label: currentClassLevel }, ...CLASS_LEVEL_OPTIONS];
    }

    return CLASS_LEVEL_OPTIONS;
  }, [editableProfile.classLevel]);

  const profileSignal = useMemo(() => {
    if (averageScore === null) {
      return {
        label: 'Signal à construire',
        detail: 'Le profil prendra de la valeur après une première séance évaluée. Pour l’instant, il faut surtout créer un premier repère exploitable.',
      };
    }
    if (averageScore >= 13.5) {
      return {
        label: 'Base solide',
        detail: 'Le profil est déjà crédible. L’enjeu est maintenant de rendre la régularité plus nette que l’intensité.',
      };
    }
    if (averageScore >= 11) {
      return {
        label: 'Progression engagée',
        detail: 'Le niveau est intermédiaire mais exploitable. Les gains viendront surtout d’un meilleur ciblage, pas d’un volume aveugle.',
      };
    }
    return {
      label: 'Relance prioritaire',
      detail: 'Le profil montre un besoin de réamorçage sur les bases. Il faut réduire la dispersion et remettre le bon axe au centre.',
    };
  }, [averageScore]);

  const updateEditableField = (field: keyof EditableProfileFields, value: string) => {
    setEditableProfile((current) => ({
      ...current,
      [field]: value,
    }));

    if (saveFeedback) {
      setSaveFeedback(null);
    }
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = editableProfile.displayName.trim();
    const normalizedClassLevel = editableProfile.classLevel.trim();

    if (!normalizedName) {
      setSaveFeedback({
        tone: 'error',
        message: 'Le nom affiché est requis pour enregistrer ton profil.',
      });
      return;
    }

    if (!normalizedClassLevel) {
      setSaveFeedback({
        tone: 'error',
        message: 'La classe est requise pour enregistrer ton profil.',
      });
      return;
    }

    const normalizedFields = {
      ...editableProfile,
      displayName: normalizedName,
      classLevel: normalizedClassLevel,
    };

    try {
      setSavingProfile(true);
      setSaveFeedback(null);

      const csrfToken = await ensurePublicCsrfToken();
      const response = await fetch('/api/v1/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(buildProfileUpdatePayload(normalizedFields)),
      });
      const responseBody = (await response.json().catch(() => null)) as
        | Partial<StudentProfile>
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        const errorBody = responseBody as { error?: string; message?: string } | null;
        const failureMessage = typeof errorBody?.error === 'string'
          ? errorBody.error
          : typeof errorBody?.message === 'string'
            ? errorBody.message
            : 'Le profil n’a pas pu être enregistré. Réessaie dans quelques secondes.';
        throw new Error(failureMessage);
      }

      const updatedProfile = (responseBody ?? {}) as Partial<StudentProfile>;
      const nextProfile: StudentProfile = {
        ...(profile ?? FALLBACK_PROFILE),
        ...updatedProfile,
        displayName: normalizedFields.displayName,
        classLevel: normalizedFields.classLevel,
        targetScore: normalizedFields.targetScore.trim() || undefined,
        establishment: normalizedFields.establishment.trim(),
        parentEmail: normalizedFields.parentEmail.trim() || null,
        teacherEmail: normalizedFields.teacherEmail.trim() || null,
      };

      setProfile(nextProfile);
      setEditableProfile(buildEditableProfileFields(nextProfile));
      setSaveFeedback({
        tone: 'success',
        message: 'Profil enregistré. Les informations affichées sont à jour.',
      });
    } catch (cause) {
      setSaveFeedback({
        tone: 'error',
        message:
          cause instanceof Error
            ? cause.message
            : 'Le profil n’a pas pu être enregistré. Réessaie dans quelques secondes.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <StateNotice
          title="Chargement de ton profil de progression"
          description="Tes compétences, erreurs récurrentes et badges sont en cours de chargement. Cela ne prend que quelques secondes."
          variant="loading"
          center
          className="mx-auto max-w-xl"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <section className="hero-premium-panel relative overflow-hidden rounded-[24px] p-6 md:p-8 lg:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--color-indigo-400)] opacity-25" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 right-6 h-20 w-20 rounded-full bg-[var(--color-indigo-700)] opacity-40" />

        <div className="relative grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
          <div>
            <div className="hero-kicker">
              <ShieldCheck className="h-4 w-4" />
              Profil de progression EAF
            </div>
            <h1 className="font-display mt-6 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              {displayName}, ton profil doit te dire où appuyer, pas seulement où tu en es.
            </h1>
            <p className="hero-body mt-5 max-w-3xl text-base leading-8 sm:text-lg">
              Le rôle de cette page est de condenser ton état réel : compétences les plus stables, erreurs récurrentes, tâches immédiates et badges
              déjà acquis.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5 text-sm">
              <span className="hero-chip">
                Niveau moyen{'\u00a0'}: <strong>{formatScoreLabel(averageScore)}</strong>
              </span>
              <span className="hero-chip">
                Point fort{'\u00a0'}: <strong>{hasEvaluationData ? strongestSkill.label : 'En construction'}</strong>
              </span>
              <span className="hero-chip">
                Axe à retendre{'\u00a0'}: <strong>{hasEvaluationData ? weakestSkill.label : 'À préciser'}</strong>
              </span>
              <span className="hero-chip">
                Mise à jour{'\u00a0'}: <strong>{resolvedProfile.skillMap.lastUpdated ? formatShortDate(resolvedProfile.skillMap.lastUpdated) : 'Diagnostic à lancer'}</strong>
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/mon-parcours"
                className="hero-primary-action px-6 py-3.5 text-sm"
              >
                Ouvrir mon parcours
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={tutorHref}
                className="hero-secondary-action px-6 py-3.5 text-sm"
              >
                Débloquer un point précis
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {[
              { label: 'Série active', value: `${resolvedProfile.streak} jours`, icon: Flame },
              { label: 'Sessions', value: `${resolvedProfile.totalSessions}`, icon: Target },
              { label: 'Copies', value: `${resolvedProfile.totalCopies}`, icon: CheckCircle2 },
              { label: 'Badges', value: `${resolvedProfile.badges.length}`, icon: Award },
            ].map((item) => (
              <div key={item.label} className="hero-glass-card rounded-[24px] p-4">
                <div className="flex items-center gap-3">
                  <div className="hero-icon-badge h-11 w-11">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="ui-stat-label">{item.label}</p>
                    <p className="mt-1 text-xl font-bold text-white">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="hero-glass-card sm:col-span-2 rounded-[24px] p-5">
              <p className="ui-stat-label text-[var(--hero-kicker-text)]">Signal global</p>
              <p className="mt-3 text-2xl font-semibold text-white">{profileSignal.label}</p>
              <p className="hero-body mt-2 text-sm leading-7">{profileSignal.detail}</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <StateNotice
          title="Impossible de charger certaines données du profil"
          description={`${error} Rafraîchis la page ou réessaie dans quelques instants.`}
          variant="error"
        />
      ) : null}

      <Card variant="default" className="rounded-[24px] bg-[var(--bg-surface)]/90 shadow-[var(--shadow-md)]" padding="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Réglages du profil</p>
            <h2 className="font-display mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
              Mets à jour les informations qui structurent vraiment ton accompagnement.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              Nom affiché, classe, objectif, établissement et contacts de suivi peuvent être modifiés ici sans repasser par l’onboarding.
            </p>
          </div>
          <Badge variant="outline" size="md" className="border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] font-semibold text-[var(--text-secondary)]">
            Mise à jour en direct
          </Badge>
        </div>

        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleProfileSave}>
          <Input
            label="Nom affiché"
            name="displayName"
            value={editableProfile.displayName}
            onChange={(event) => updateEditableField('displayName', event.target.value)}
            required
            autoComplete="name"
            hint="C’est le nom utilisé dans le dashboard et les emails."
          />
          <Select
            label="Classe"
            name="classLevel"
            value={editableProfile.classLevel}
            onChange={(event) => updateEditableField('classLevel', event.target.value)}
            options={classLevelOptions}
          />
          <Input
            label="Objectif visé"
            name="targetScore"
            value={editableProfile.targetScore}
            onChange={(event) => updateEditableField('targetScore', event.target.value)}
            placeholder="Ex. 14/20"
            hint="Laisse vide si tu préfères ne pas afficher d’objectif."
          />
          <Input
            label="Établissement"
            name="establishment"
            value={editableProfile.establishment}
            onChange={(event) => updateEditableField('establishment', event.target.value)}
            autoComplete="organization"
          />
          <Input
            label="E-mail parent"
            name="parentEmail"
            type="email"
            value={editableProfile.parentEmail}
            onChange={(event) => updateEditableField('parentEmail', event.target.value)}
            autoComplete="email"
            hint="Optionnel. Un email d’information est envoyé si tu ajoutes ou modifies cette adresse."
          />
          <Input
            label="E-mail enseignant"
            name="teacherEmail"
            type="email"
            value={editableProfile.teacherEmail}
            onChange={(event) => updateEditableField('teacherEmail', event.target.value)}
            autoComplete="email"
            hint="Optionnel. L’adresse peut être utilisée pour rattacher ton suivi."
          />

          <div className="md:col-span-2 flex flex-col gap-3 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--c-primary)]">Enregistrement sécurisé</p>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                Cette action utilise le même contrôle CSRF que les autres mutations sensibles de la plateforme.
              </p>
              {saveFeedback ? (
                <p
                  className={`text-sm font-medium ${
                    saveFeedback.tone === 'success'
                      ? 'text-[var(--c-success)]'
                      : 'text-[var(--c-accent)]'
                  }`}
                  role={saveFeedback.tone === 'success' ? 'status' : 'alert'}
                  aria-live={saveFeedback.tone === 'success' ? 'polite' : 'assertive'}
                >
                  {saveFeedback.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" size="lg" loading={savingProfile} className="min-h-[44px] sm:min-w-[220px]">
              Enregistrer le profil
            </Button>
          </div>
        </form>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card variant="default" className="rounded-[24px] bg-[var(--bg-surface)]/90 shadow-[var(--shadow-md)]" padding="md">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Cartographie actuelle</p>
          <h2 className="font-display mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
            Quatre axes lisibles, pour éviter une lecture floue de tes progrès.
          </h2>

          <div className="mt-8 space-y-5">
            {skillCards.map((skill) => {
              const Icon = skill.icon;
              return (
                <div key={skill.key}>
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-secondary)] text-[var(--c-primary)]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--c-primary)]">{skill.label}</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{skill.copy}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[var(--text-muted)]">{formatScoreLabel(skill.score)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--border-default)]">
                    <div className={`h-2.5 rounded-full ${skill.accent}`} style={{ width: `${((skill.score ?? 0) / 20) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card variant="default" className="rounded-[24px] border-[var(--border-strong)] bg-[var(--bg-surface-secondary)]" padding="sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Axe fort</p>
              <p className="mt-3 text-lg font-semibold text-[var(--c-primary)]">{hasEvaluationData ? strongestSkill.label : 'En construction'}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {hasEvaluationData
                  ? 'C’est là que le niveau est le plus naturellement stable aujourd’hui.'
                  : 'Ce repère apparaîtra après une première séance évaluée.'}
              </p>
            </Card>
            <Card variant="default" className="rounded-[24px] border-[var(--border-strong)] bg-[var(--bg-surface-secondary)]" padding="sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Axe prioritaire</p>
              <p className="mt-3 text-lg font-semibold text-[var(--c-primary)]">{hasEvaluationData ? weakestSkill.label : 'À préciser'}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {hasEvaluationData
                  ? 'C’est l’endroit où une séance bien choisie rapportera le plus vite.'
                  : 'Le prochain axe prioritaire émergera dès qu’une première évaluation aura créé un vrai signal.'}
              </p>
            </Card>
          </div>
        </Card>

        <div className="space-y-6">
          <Card variant="default" className="rounded-[24px] bg-[var(--bg-surface)]/90 shadow-[var(--shadow-md)]" padding="md">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Points de vigilance</p>
            <h2 className="font-display mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
              Les erreurs récurrentes doivent rester visibles, pas seulement ressenties.
            </h2>

            {topErrors.length === 0 ? (
              <div className="mt-8">
                <StateNotice
                  title="Aucune erreur récurrente identifiée"
                  description="Au fil de tes ateliers et évaluations, les points de vigilance récurrents apparaîtront ici pour t’aider à cibler tes prochaines révisions."
                  variant="empty"
                  icon={CheckCircle2}
                  center
                />
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                {topErrors.map((entry) => (
                  <article key={`${entry.type}-${entry.firstSeen}`} className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-reward)] text-[var(--color-amber-300)]">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--c-primary)]">{entry.type}</p>
                          <Badge variant="outline" size="sm" className="border-[var(--border-reward)] font-bold uppercase tracking-[0.16em] text-[var(--text-reward-on-subtle)]">
                            {entry.count} occurrences
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{entry.description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>

          <Card variant="dark" className="rounded-[24px]" padding="md">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">72 prochaines heures</p>
            <h2 className="font-display mt-4 text-4xl leading-tight tracking-[-0.03em] text-white">
              Les prochaines tâches doivent être courtes, claires et immédiatement lançables.
            </h2>

            <div className="mt-8 space-y-3">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <article key={task.id} className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge variant="default" size="sm" className={`font-bold uppercase tracking-[0.16em] ${PRIORITY_STYLE[task.priority]}`}>
                        {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                      </Badge>
                      <span className="hero-body-muted text-xs font-semibold uppercase tracking-[0.16em]">
                        {task.estimatedMinutes} min · {formatShortDate(task.dueDate)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-white">{task.description}</p>
                  </article>
                ))
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-[24px] border border-white/10 bg-white/8 p-6 text-center backdrop-blur-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Target className="hero-body-muted h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-white">Pas encore de tâches planifiées</p>
                  <p className="hero-body max-w-sm text-sm leading-7">
                    Ouvre ton parcours ou lance un atelier pour que les prochaines actions concrètes apparaissent ici.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/mon-parcours"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--bg-page)] px-5 py-3 text-sm font-bold text-[var(--c-primary)] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                Voir tout le plan
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={tutorHref}
                className="inline-flex items-center justify-center rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/6"
              >
                Demander une relance
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <Card variant="default" className="rounded-[24px] bg-[var(--bg-surface)]/90 shadow-[var(--shadow-md)]" padding="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Badges et traces positives</p>
            <h2 className="font-display mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
              Les marqueurs de progression comptent aussi pour soutenir la constance.
            </h2>
          </div>
          <Badge variant="outline" size="md" className="border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] font-semibold text-[var(--text-secondary)]">
            {resolvedProfile.badges.length} badges actifs
          </Badge>
        </div>

        {!resolvedProfile.badges.length ? (
          <div className="mt-8">
            <StateNotice
              title="Tes premiers badges arrivent bientôt"
              description="Chaque atelier terminé, chaque série de jours actifs et chaque seuil franchi te rapprochent d’un nouveau badge. Continue sur ta lancée !"
              variant="empty"
              icon={Award}
              center
              action={
                <Link
                  href="/atelier-ecrit"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:border-[var(--c-success)] hover:text-[var(--c-success)]"
                >
                  Lancer un atelier
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resolvedProfile.badges.map((badge, index) => (
              <article
                key={badge}
                className={`rounded-[24px] border border-white/10 bg-gradient-to-br ${BADGE_STYLES[index % BADGE_STYLES.length]} p-5 text-white shadow-[var(--shadow-md)]`}
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-semibold leading-7">{badge}</p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Trace de progression utile : ce badge matérialise une régularité ou un passage de seuil déjà atteint.
                </p>
              </article>
            ))}
          </div>
        )}
      </Card>

      {/* ── Zone dangereuse — Suppression de compte (RGPD Art. 17) ── */}
      <Card className="mt-8 border-red-500/30">
        <h2 className="flex items-center gap-2 text-lg font-bold text-red-500">
          <Trash2 className="h-5 w-5" />
          Zone dangereuse
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Conformément au RGPD (article 17), tu peux demander la suppression définitive de ton compte et de toutes tes données.
          Cette action est irréversible.
        </p>

        {!showDeleteConfirm ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-4 border-red-500/40 text-red-500 hover:bg-red-500/10"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Supprimer mon compte
          </Button>
        ) : (
          <div className="mt-4 space-y-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <p className="text-sm font-semibold text-red-500">
              Confirme la suppression en saisissant ton adresse e-mail :
            </p>
            <Input
              type="email"
              value={deleteEmail}
              onChange={(e) => { setDeleteEmail(e.target.value); setDeleteError(null); }}
              placeholder="ton-email@exemple.com"
              className="border-red-500/30"
            />
            {deleteError && (
              <p className="text-xs font-medium text-red-500">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowDeleteConfirm(false); setDeleteEmail(''); setDeleteError(null); }}
                disabled={deletingAccount}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                disabled={deletingAccount || !deleteEmail.trim()}
                onClick={async () => {
                  setDeletingAccount(true);
                  setDeleteError(null);
                  try {
                    const csrfToken = await ensurePublicCsrfToken();
                    const res = await fetch('/api/v1/account/delete', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
                      },
                      body: JSON.stringify({ confirmEmail: deleteEmail.trim() }),
                    });
                    if (res.ok) {
                      window.location.href = '/login?deleted=1';
                    } else {
                      const body = await res.json().catch(() => ({}));
                      setDeleteError(body.error ?? 'Une erreur est survenue. Contacte dpo@nexusreussite.academy.');
                    }
                  } catch {
                    setDeleteError('Erreur réseau. Réessaie ou contacte dpo@nexusreussite.academy.');
                  } finally {
                    setDeletingAccount(false);
                  }
                }}
              >
                {deletingAccount ? 'Suppression...' : 'Confirmer la suppression'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
