'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Award,
  BrainCircuit,
  Lock,
  Mic,
  PenTool,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import { ensurePublicCsrfToken } from '@/lib/security/csrf-client';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';

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
    tasks: [
      { id: '1', description: 'Simulation orale 12+8 min', estimatedMinutes: 25, dueDate: '2026-04-12', skill: 'oral', priority: 'high' },
      { id: '2', description: 'Question de grammaire sur phrase courte', estimatedMinutes: 20, dueDate: '2026-04-13', skill: 'grammaire', priority: 'medium' },
      { id: '3', description: 'Plan détaillé de dissertation', estimatedMinutes: 30, dueDate: '2026-04-14', skill: 'ecrit', priority: 'medium' },
    ],
  },
  badges: ['Première copie déposée 📋', 'Quiz parfait ⭐'],
  streak: 0,
  totalSessions: 143,
  totalCopies: 10,
  displayName: 'Élève',
  selectedOeuvres: [],
  hasEvaluationData: false,
};

const PRIORITY_STYLE = {
  high: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', color: '#ef4444', label: 'Haute' },
  medium: { bg: 'rgba(255,181,71,0.10)', border: 'var(--eaf-gold-border)', color: 'var(--eaf-gold)', label: 'Moyenne' },
  low: { bg: 'rgba(26,213,160,0.08)', border: 'var(--eaf-teal-border)', color: 'var(--eaf-teal)', label: 'Faible' },
};

const SKILL_META = [
  {
    key: 'ecrit' as const,
    label: 'Écrit',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.12)',
    copy: 'Construire plus vite une réponse solide, sans perdre la tension du sujet.',
    icon: PenTool,
    score: 7.3,
  },
  {
    key: 'oral' as const,
    label: 'Oral',
    color: 'var(--eaf-teal)',
    bgColor: 'var(--eaf-teal-dim)',
    copy: 'Tenir la lecture, l\'explication et la relance avec plus de fluidité.',
    icon: Mic,
    score: 7.7,
  },
  {
    key: 'grammaire' as const,
    label: 'Grammaire',
    color: 'var(--eaf-orange)',
    bgColor: 'var(--eaf-orange-dim)',
    copy: 'Stabiliser les notions qui font perdre des points trop vite.',
    icon: BrainCircuit,
    score: 7.1,
  },
  {
    key: 'lectureCursive' as const,
    label: 'Lecture cursive',
    color: 'var(--eaf-indigo)',
    bgColor: 'var(--eaf-indigo-dim)',
    copy: 'Garder les œuvres et leurs enjeux disponibles au moment utile.',
    icon: Target,
    score: 7.4,
  },
];

const CLASS_LEVEL_OPTIONS = [
  { value: 'Première générale', label: 'Première générale' },
  { value: 'Première technologique', label: 'Première technologique' },
  { value: 'Première STMG', label: 'Première STMG' },
  { value: 'Première ST2S', label: 'Première ST2S' },
  { value: 'Première STI2D', label: 'Première STI2D' },
  { value: 'Première STL', label: 'Première STL' },
];



const VIGILANCE_POINTS = [
  {
    title: 'Évite les formulations familières ou orales : « ça donne faim ! » ou « c\'est un texte qui parle de... ». Reformule ces phrases de manière plus soutenue et analytique.',
    count: 1,
    reinforce: 'Évite les formulations familières ou orales : « ça donne faim ! » ou « c\'est un texte qui parle de... ». Reformule ces phrases de manière plus soutenue et analytique.',
  },
  {
    title: 'Ne te contente pas de paraphraser le texte. Par exemple, au lieu de dire « Ça veut dire qu\'elle est vieille ou qu\'elle a beaucoup travaillé pour lui », analyse le procédé stylistique et son effet.',
    count: 1,
    reinforce: 'Ne te contente pas de paraphraser le texte. Analyse le procédé stylistique et son effet.',
  },
  {
    title: 'Cite davantage le texte pour appuyer tes analyses. Par exemple, au lieu de dire « Il dit que la maison gardait tout », cite le passage exact et explique en quoi cela illustre la mémoire.',
    count: 1,
    reinforce: 'Cite davantage le texte pour appuyer tes analyses.',
  },
  {
    title: 'Structure mieux tes paragraphes. Commence chaque partie par une phrase d\'introduction claire qui annonce ton idée directe, puis développe avec des exemples précis et des analyses.',
    count: 1,
    reinforce: 'Structure mieux tes paragraphes avec une idée directe claire.',
  },
];

function formatShortDate(date: string | null) {
  if (!date) return 'Diagnostic à lancer';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Date à préciser';
  return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function formatScoreLabel(value: number | null) {
  if (value === null) return 'Diagnostic à lancer';
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

        const data = await response.json() as StudentProfile;
        setProfile(data);
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
  const displayPlan = 'Masterium'; // Would come from billing status
  const tutorHref = buildTuteurHref({
    workId: resolvedProfile.oeuvreChoisieEntretien ?? resolvedProfile.selectedOeuvres?.[0] ?? null,
  });

  const strongestSkill = SKILL_META.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), SKILL_META[0]);
  const weakestSkill = SKILL_META.reduce((prev, curr) => (curr.score < prev.score ? curr : prev), SKILL_META[0]);
  const averageScore = SKILL_META.reduce((sum, s) => sum + s.score, 0) / SKILL_META.length;
  const upcomingTasks = resolvedProfile.studyPlan.tasks.slice(0, 3);

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
        body: JSON.stringify({
          displayName: normalizedName,
          classLevel: normalizedClassLevel,
          targetScore: editableProfile.targetScore.trim() || undefined,
          establishment: editableProfile.establishment.trim(),
          parentEmail: editableProfile.parentEmail.trim() || null,
          teacherEmail: editableProfile.teacherEmail.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null) as { error?: string; message?: string } | null;
        const failureMessage = typeof errorBody?.error === 'string'
          ? errorBody.error
          : typeof errorBody?.message === 'string'
            ? errorBody.message
            : 'Le profil n\'a pas pu être enregistré. Réessaie dans quelques secondes.';
        throw new Error(failureMessage);
      }

      setSaveFeedback({
        tone: 'success',
        message: 'Profil enregistré. Les informations affichées sont à jour.',
      });
    } catch (cause) {
      setSaveFeedback({
        tone: 'error',
        message: cause instanceof Error ? cause.message : 'Le profil n\'a pas pu être enregistré.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const inputStyle = {
    background: 'var(--eaf-bg2)',
    border: '1px solid var(--eaf-border)',
    color: 'var(--eaf-text-primary)',
    fontFamily: 'var(--eaf-font-body)',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle = {
    color: 'var(--eaf-text-secondary)',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '6px',
    display: 'block',
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--eaf-border)] border-t-[var(--eaf-indigo)]" />
          <p style={{ color: 'var(--eaf-text-secondary)' }}>Chargement de ton profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ─── B.2 — HERO CARD ─── */}
      <section 
        className="relative overflow-hidden rounded-[24px] p-8 md:p-10"
        style={{ 
          background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)',
          border: '1px solid var(--eaf-indigo-border)'
        }}
      >
        {/* Decorative orb */}
        <div 
          className="pointer-events-none absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(123,142,255,0.06), transparent 70%)' }}
        />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
          {/* Colonne gauche */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Target className="h-3.5 w-3.5" style={{ color: 'var(--eaf-indigo)' }} />
              <span 
                className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--eaf-indigo)' }}
              >
                Profil de progression EAF
              </span>
            </div>

            <h1 
              className="text-[36px] md:text-[48px] font-bold leading-[1.08] tracking-[-2px] mb-5"
              style={{ 
                fontFamily: 'var(--eaf-font-display)',
                color: 'var(--eaf-text-primary)'
              }}
            >
              {displayName} ({displayPlan}), ton profil doit te dire où appuyer, pas seulement où tu en es.
            </h1>

            <p 
              className="text-[14px] leading-[1.7] max-w-[460px] mb-6"
              style={{ color: 'var(--eaf-text-secondary)' }}
            >
              Le rôle de cette page est de condenser ton état réel : compétences les plus stables, erreurs récurrentes, tâches immédiates et badges déjà acquis.
            </p>

            {/* Métadonnées */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6">
              {[
                { label: 'Niveau moyen', value: formatScoreLabel(averageScore) },
                { label: 'Point fort', value: strongestSkill.label },
                { label: 'Axe à retendre', value: weakestSkill.label },
                { label: 'Mise à jour', value: formatShortDate(resolvedProfile.skillMap.lastUpdated) },
              ].map((meta, idx, arr) => (
                <span key={meta.label} className="flex items-center gap-2">
                  <span style={{ color: 'var(--eaf-text-tertiary)' }}>{meta.label} :</span>
                  <span style={{ color: 'var(--eaf-text-primary)', fontWeight: 600 }}>{meta.value}</span>
                  {idx < arr.length - 1 && (
                    <span className="ml-2" style={{ color: 'var(--eaf-text-tertiary)' }}>|</span>
                  )}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/mon-parcours"
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-semibold text-white transition-all"
                style={{ background: 'var(--eaf-orange)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--eaf-orange-hover)';
                  e.currentTarget.style.boxShadow = '0 6px 25px var(--eaf-orange-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--eaf-orange)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Ouvrir mon parcours
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={tutorHref}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-medium transition-all"
                style={{ 
                  background: 'transparent',
                  border: '1px solid var(--eaf-border)',
                  color: 'var(--eaf-text-secondary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-indigo-border)';
                  e.currentTarget.style.color = 'var(--eaf-indigo)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-border)';
                  e.currentTarget.style.color = 'var(--eaf-text-secondary)';
                }}
              >
                Débloquer un point précis
              </Link>
            </div>
          </div>

          {/* Colonne droite */}
          <div>
            {/* Grid 2×2 stats */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[
                { label: 'SÉRIE ACTIVE', value: `${resolvedProfile.streak} jours` },
                { label: 'SESSIONS', value: `${resolvedProfile.totalSessions}` },
                { label: 'COPIES', value: `${resolvedProfile.totalCopies}` },
                { label: 'BADGES', value: `${resolvedProfile.badges.length}` },
              ].map((stat) => (
                <div 
                  key={stat.label}
                  className="rounded-xl p-3.5"
                  style={{ 
                    background: 'rgba(255,255,255,0.04)', 
                    border: '1px solid var(--eaf-border)'
                  }}
                >
                  <p 
                    className="text-[10px] font-semibold uppercase tracking-[0.06em] mb-1.5"
                    style={{ color: 'var(--eaf-text-tertiary)' }}
                  >
                    {stat.label}
                  </p>
                  <p 
                    className="text-[24px] font-bold"
                    style={{ 
                      fontFamily: 'var(--eaf-font-display)',
                      color: 'var(--eaf-text-primary)'
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Card Signal global */}
            <div 
              className="rounded-xl p-4"
              style={{ 
                background: 'var(--eaf-bg2)', 
                border: '1px solid var(--eaf-border)'
              }}
            >
              <p 
                className="text-[10px] font-semibold uppercase tracking-[0.06em] mb-2"
                style={{ color: 'var(--eaf-text-tertiary)' }}
              >
                Signal global
              </p>
              <p 
                className="text-[18px] font-bold mb-1.5"
                style={{ 
                  fontFamily: 'var(--eaf-font-display)',
                  color: 'var(--eaf-text-primary)'
                }}
              >
                Relance prioritaire
              </p>
              <p 
                className="text-[12px] leading-[1.5]"
                style={{ color: 'var(--eaf-text-secondary)' }}
              >
                Le profil montre un besoin de réamorçage sur les bases. Il faut réduire la dispersion et remettre le bon axe au centre.
              </p>
              {/* Barre de progression */}
              <div 
                className="h-[3px] rounded-full mt-3"
                style={{ background: 'var(--eaf-bg3)' }}
              >
                <div 
                  className="h-[3px] rounded-full"
                  style={{ 
                    width: '60%',
                    background: 'var(--eaf-gradient-progress)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div 
          className="rounded-xl p-4"
          style={{ 
            background: 'rgba(255,107,53,0.06)', 
            border: '1px solid var(--eaf-orange-border)'
          }}
        >
          <p style={{ color: 'var(--eaf-orange)' }}>{error}</p>
        </div>
      ) : null}

      {/* ─── B.3 — SECTION RÉGLAGES DU PROFIL ─── */}
      <div 
        className="rounded-[20px] p-7 relative"
        style={{ 
          background: 'var(--eaf-bg1)', 
          border: '1px solid var(--eaf-border)'
        }}
      >
        {/* Badge top right */}
        <div 
          className="absolute top-6 right-6 rounded-lg px-3 py-1.5 text-[12px] font-semibold"
          style={{ 
            background: 'var(--eaf-teal-dim)', 
            border: '1px solid var(--eaf-teal-border)',
            color: 'var(--eaf-teal)'
          }}
        >
          Mise à jour en direct
        </div>

        <span 
          className="text-[11px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: 'var(--eaf-indigo)' }}
        >
          Réglages du profil
        </span>

        <h2 
          className="text-[32px] font-bold leading-[1.15] tracking-[-1.2px] mt-2 mb-2"
          style={{ 
            fontFamily: 'var(--eaf-font-display)',
            color: 'var(--eaf-text-primary)'
          }}
        >
          Mets à jour les informations qui structurent vraiment ton accompagnement.
        </h2>

        <p 
          className="text-[14px] mb-7 max-w-2xl"
          style={{ color: 'var(--eaf-text-secondary)' }}
        >
          Nom affiché, classe, objectif, établissement et contacts de suivi peuvent être modifiés ici sans repasser par l&apos;onboarding.
        </p>

        <form onSubmit={handleProfileSave}>
          <div className="grid gap-5 md:grid-cols-2">
            {/* Rangée 1 */}
            <div>
              <label style={labelStyle}>Nom affiché</label>
              <input
                type="text"
                value={editableProfile.displayName}
                onChange={(e) => updateEditableField('displayName', e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p 
                className="text-[11px] mt-1"
                style={{ color: 'var(--eaf-text-tertiary)' }}
              >
                C&apos;est le nom utilisé dans le dashboard et les emails.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Classe</label>
              <select
                value={editableProfile.classLevel}
                onChange={(e) => updateEditableField('classLevel', e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {CLASS_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Rangée 2 */}
            <div>
              <label style={labelStyle}>Objectif visé</label>
              <input
                type="text"
                value={editableProfile.targetScore}
                onChange={(e) => updateEditableField('targetScore', e.target.value)}
                placeholder="Ex. 14/20"
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p 
                className="text-[11px] mt-1"
                style={{ color: 'var(--eaf-text-tertiary)' }}
              >
                Laisse vide si tu préfères ne pas afficher d&apos;objectif.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Établissement</label>
              <input
                type="text"
                value={editableProfile.establishment}
                onChange={(e) => updateEditableField('establishment', e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Rangée 3 */}
            <div>
              <label style={labelStyle}>E-mail parent</label>
              <input
                type="email"
                value={editableProfile.parentEmail}
                onChange={(e) => updateEditableField('parentEmail', e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p 
                className="text-[11px] mt-1"
                style={{ color: 'var(--eaf-text-tertiary)' }}
              >
                Optionnel. Un email d&apos;information est envoyé si tu ajoutes ou modifies cette adresse.
              </p>
            </div>

            <div>
              <label style={labelStyle}>E-mail enseignant</label>
              <input
                type="email"
                value={editableProfile.teacherEmail}
                onChange={(e) => updateEditableField('teacherEmail', e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(123,142,255,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <p 
                className="text-[11px] mt-1"
                style={{ color: 'var(--eaf-text-tertiary)' }}
              >
                Optionnel. L&apos;adresse peut être utilisée pour rattacher ton suivi.
              </p>
            </div>
          </div>

          {/* Footer formulaire */}
          <div 
            className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-5 rounded-b-xl"
            style={{ borderTop: '1px solid var(--eaf-border)' }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                style={{ 
                  background: 'var(--eaf-teal-dim)',
                  color: 'var(--eaf-teal)'
                }}
              >
                <Lock className="h-3.5 w-3.5" />
              </div>
              <div>
                <p 
                  className="text-sm font-semibold"
                  style={{ color: 'var(--eaf-teal)' }}
                >
                  Enregistrement sécurisé
                </p>
                <p 
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--eaf-text-tertiary)' }}
                >
                  Cette action utilise le même contrôle CSRF que les autres mutations sensibles de la plateforme.
                </p>
                {saveFeedback ? (
                  <p
                    className="text-sm font-medium mt-2"
                    style={{ 
                      color: saveFeedback.tone === 'success' ? 'var(--eaf-teal)' : 'var(--eaf-orange)'
                    }}
                  >
                    {saveFeedback.message}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 rounded-lg text-[14px] font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: 'var(--eaf-orange)' }}
              onMouseEnter={(e) => {
                if (!savingProfile) {
                  e.currentTarget.style.background = 'var(--eaf-orange-hover)';
                  e.currentTarget.style.boxShadow = '0 6px 25px var(--eaf-orange-glow)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--eaf-orange)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {savingProfile ? 'Enregistrement...' : 'Enregistrer le profil'}
            </button>
          </div>
        </form>
      </div>

      {/* ─── B.4 — GRID 2 COLONNES : Cartographie + Points de vigilance ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cartographie actuelle */}
        <div 
          className="rounded-[20px] p-7"
          style={{ 
            background: 'var(--eaf-bg1)', 
            border: '1px solid var(--eaf-border)'
          }}
        >
          <span 
            className="text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--eaf-indigo)' }}
          >
            Cartographie actuelle
          </span>

          <h2 
            className="text-[26px] font-bold leading-[1.15] tracking-[-1px] mt-2 mb-6"
            style={{ 
              fontFamily: 'var(--eaf-font-display)',
              color: 'var(--eaf-text-primary)'
            }}
          >
            Quatre axes lisibles, pour éviter une lecture floue de tes progrès.
          </h2>

          <div className="space-y-3">
            {SKILL_META.map((skill) => {
              const Icon = skill.icon;
              const percent = (skill.score / 20) * 100;
              
              return (
                <div 
                  key={skill.key}
                  className="rounded-xl p-4"
                  style={{ 
                    background: 'var(--eaf-bg2)', 
                    border: '1px solid var(--eaf-border)'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: skill.bgColor }}
                      >
                        <Icon className="h-4 w-4" style={{ color: skill.color }} />
                      </div>
                      <div>
                        <p 
                          className="text-sm font-semibold"
                          style={{ color: 'var(--eaf-text-primary)' }}
                        >
                          {skill.label}
                        </p>
                        <p 
                          className="text-[11px] italic"
                          style={{ color: 'var(--eaf-text-tertiary)' }}
                        >
                          {skill.copy}
                        </p>
                      </div>
                    </div>
                    <span 
                      className="text-sm font-bold shrink-0"
                      style={{ 
                        fontFamily: 'var(--eaf-font-display)',
                        color: 'var(--eaf-text-primary)'
                      }}
                    >
                      {formatScoreLabel(skill.score)}
                    </span>
                  </div>

                  <div 
                    className="h-1.5 rounded-full"
                    style={{ background: 'var(--eaf-bg3)' }}
                  >
                    <div 
                      className="h-1.5 rounded-full"
                      style={{ 
                        width: `${percent}%`,
                        background: skill.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid 2 cartes Axe fort / Axe prioritaire */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Axe fort */}
            <div 
              className="rounded-xl p-4"
              style={{ 
                background: 'var(--eaf-teal-dim)', 
                border: '1px solid var(--eaf-teal-border)'
              }}
            >
              <p 
                className="text-[10px] font-semibold uppercase tracking-[0.06em] mb-2"
                style={{ color: 'var(--eaf-teal)' }}
              >
                Axe fort
              </p>
              <p 
                className="text-lg font-bold mb-1"
                style={{ 
                  fontFamily: 'var(--eaf-font-display)',
                  color: 'var(--eaf-teal)'
                }}
              >
                {strongestSkill.label}
              </p>
              <p 
                className="text-xs leading-[1.5]"
                style={{ color: 'var(--eaf-text-secondary)' }}
              >
                C&apos;est là que le niveau est le plus naturellement stable aujourd&apos;hui.
              </p>
            </div>

            {/* Axe prioritaire */}
            <div 
              className="rounded-xl p-4"
              style={{ 
                background: 'rgba(255,107,53,0.08)', 
                border: '1px solid var(--eaf-orange-border)'
              }}
            >
              <p 
                className="text-[10px] font-semibold uppercase tracking-[0.06em] mb-2"
                style={{ color: 'var(--eaf-orange)' }}
              >
                Axe prioritaire
              </p>
              <p 
                className="text-lg font-bold mb-1"
                style={{ 
                  fontFamily: 'var(--eaf-font-display)',
                  color: 'var(--eaf-orange)'
                }}
              >
                {weakestSkill.label}
              </p>
              <p 
                className="text-xs leading-[1.5]"
                style={{ color: 'var(--eaf-text-secondary)' }}
              >
                C&apos;est l&apos;endroit où une séance bien choisie rapportera le plus vite.
              </p>
            </div>
          </div>
        </div>

        {/* Points de vigilance */}
        <div 
          className="rounded-[20px] p-7"
          style={{ 
            background: 'var(--eaf-bg1)', 
            border: '1px solid var(--eaf-border)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <span 
                className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--eaf-indigo)' }}
              >
                Points de vigilance
              </span>
              <h2 
                className="text-[26px] font-bold leading-[1.15] tracking-[-1px] mt-2"
                style={{ 
                  fontFamily: 'var(--eaf-font-display)',
                  color: 'var(--eaf-text-primary)'
                }}
              >
                Les erreurs récurrentes doivent rester visibles, pas seulement ressenties.
              </h2>
            </div>
            
            {/* Badge d'action */}
            <div 
              className="rounded-full px-3 py-1.5 flex items-center gap-2 shrink-0"
              style={{ 
                background: 'var(--eaf-bg3)', 
                border: '1px solid var(--eaf-border)'
              }}
            >
              <span 
                className="text-xs"
                style={{ color: 'var(--eaf-text-secondary)' }}
              >
                Soumettre à nouveau la copie.
              </span>
              <span 
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ 
                  background: 'rgba(255,107,53,0.12)', 
                  border: '1px solid var(--eaf-orange-border)',
                  color: 'var(--eaf-orange)'
                }}
              >
                2 OCCURRENCES
              </span>
            </div>
          </div>

          <div className="space-y-3 mt-5">
            {VIGILANCE_POINTS.map((point, idx) => (
              <div 
                key={idx}
                className="rounded-xl p-4 transition-all"
                style={{ 
                  background: 'var(--eaf-bg2)', 
                  border: '1px solid var(--eaf-border)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,107,53,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-border)';
                }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
                    style={{ 
                      background: 'rgba(255,181,71,0.10)',
                      border: '1px solid var(--eaf-gold-border)',
                    }}
                  >
                    ⚠️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-[13px] font-semibold leading-[1.5]"
                      style={{ color: 'var(--eaf-text-primary)' }}
                    >
                      {point.title}
                    </p>
                    <span 
                      className="inline-block mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ 
                        background: 'rgba(255,181,71,0.08)', 
                        border: '1px solid var(--eaf-gold-border)',
                        color: 'var(--eaf-gold)'
                      }}
                    >
                      {point.count} OCCURRENCES
                    </span>
                    <div 
                      className="mt-3 pt-3"
                      style={{ borderTop: '1px solid var(--eaf-border)' }}
                    >
                      <p 
                        className="text-xs leading-[1.5]"
                        style={{ color: 'var(--eaf-text-tertiary)' }}
                      >
                        Point à renforcer : {point.reinforce}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── B.5 — CARD 72 PROCHAINES HEURES ─── */}
      <div 
        className="relative overflow-hidden rounded-[20px] p-7"
        style={{ 
          background: 'linear-gradient(135deg, #0f1e3a, #111c30)',
          border: '1px solid var(--eaf-indigo-border)'
        }}
      >
        {/* Decorative orb */}
        <div 
          className="pointer-events-none absolute -right-12 -top-12 h-[250px] w-[250px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(123,142,255,0.08), transparent 70%)' }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">⚡</span>
            <span 
              className="text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: 'var(--eaf-gold)' }}
            >
              72 prochaines heures
            </span>
          </div>

          <h2 
            className="text-[24px] font-bold leading-[1.2] tracking-[-1px] mb-5"
            style={{ 
              fontFamily: 'var(--eaf-font-display)',
              color: 'var(--eaf-text-primary)'
            }}
          >
            Les prochaines tâches doivent être courtes, claires et immédiatement lançables.
          </h2>

          <div className="space-y-2">
            {upcomingTasks.map((task) => (
              <div 
                key={task.id}
                className="rounded-xl p-3.5"
                style={{ 
                  background: 'rgba(255,255,255,0.04)', 
                  border: '1px solid var(--eaf-border)'
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span 
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                    style={{ 
                      background: PRIORITY_STYLE[task.priority].bg,
                      border: `1px solid ${PRIORITY_STYLE[task.priority].border}`,
                      color: PRIORITY_STYLE[task.priority].color
                    }}
                  >
                    {PRIORITY_STYLE[task.priority].label}
                  </span>
                  <span 
                    className="text-[11px] font-medium uppercase tracking-wide"
                    style={{ color: 'var(--eaf-text-tertiary)' }}
                  >
                    {task.estimatedMinutes} MIN · {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase()}
                  </span>
                </div>
                <p 
                  className="text-[13px] font-semibold"
                  style={{ color: 'var(--eaf-text-primary)' }}
                >
                  {task.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              href="/mon-parcours"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all"
              style={{ 
                background: 'var(--eaf-orange)',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--eaf-orange-hover)';
                e.currentTarget.style.boxShadow = '0 6px 25px var(--eaf-orange-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--eaf-orange)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Voir tout le plan
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={tutorHref}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-medium transition-all"
              style={{ 
                background: 'transparent',
                border: '1px solid var(--eaf-border)',
                color: 'var(--eaf-text-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--eaf-indigo-border)';
                e.currentTarget.style.color = 'var(--eaf-indigo)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--eaf-border)';
                e.currentTarget.style.color = 'var(--eaf-text-secondary)';
              }}
            >
              Demander une relance
            </Link>
          </div>
        </div>
      </div>

      {/* ─── B.6 — BADGES ET TRACES POSITIVES ─── */}
      <div 
        className="rounded-[20px] p-7"
        style={{ 
          background: 'var(--eaf-bg1)', 
          border: '1px solid var(--eaf-border)'
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <span 
              className="text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: 'var(--eaf-indigo)' }}
            >
              Badges et traces positives
            </span>
            <h2 
              className="text-[28px] font-bold mt-2"
              style={{ 
                fontFamily: 'var(--eaf-font-display)',
                color: 'var(--eaf-text-primary)'
              }}
            >
              Les marqueurs de progression comptent aussi pour soutenir la constance.
            </h2>
          </div>
          <div 
            className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
            style={{ 
              background: 'var(--eaf-bg3)', 
              border: '1px solid var(--eaf-border)',
              color: 'var(--eaf-text-secondary)'
            }}
          >
            {resolvedProfile.badges.length} badges actifs
          </div>
        </div>

        {resolvedProfile.badges.length === 0 ? (
          <div 
            className="text-center py-8"
            style={{ color: 'var(--eaf-text-tertiary)' }}
          >
            <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Tes premiers badges arrivent bientôt !</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {resolvedProfile.badges.map((badge, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={badge}
                  className="relative overflow-hidden rounded-xl p-5"
                  style={{
                    background: isFirst 
                      ? 'linear-gradient(135deg, rgba(123,142,255,0.12), rgba(123,142,255,0.06))' 
                      : 'linear-gradient(135deg, rgba(26,213,160,0.12), rgba(26,213,160,0.06))',
                    border: `1px solid ${isFirst ? 'var(--eaf-indigo-border)' : 'var(--eaf-teal-border)'}`,
                  }}
                >
                  {/* Decorative circle */}
                  <div 
                    className="absolute -bottom-5 -right-5 h-20 w-20 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  />

                  <div 
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg mb-3"
                    style={{ 
                      background: isFirst ? 'var(--eaf-indigo-dim)' : 'var(--eaf-teal-dim)',
                      border: `1px solid ${isFirst ? 'var(--eaf-indigo-border)' : 'var(--eaf-teal-border)'}`,
                    }}
                  >
                    <Sparkles 
                      className="h-5 w-5" 
                      style={{ color: isFirst ? 'var(--eaf-indigo)' : 'var(--eaf-teal)' }} 
                    />
                  </div>

                  <p 
                    className="text-[14px] font-bold mb-2"
                    style={{ 
                      color: isFirst ? 'var(--eaf-indigo)' : 'var(--eaf-teal)'
                    }}
                  >
                    {badge}
                  </p>
                  <p 
                    className="text-[12px] leading-[1.5]"
                    style={{ color: 'var(--eaf-text-secondary)' }}
                  >
                    Trace de progression utile : ce badge matérialise une régularité ou un passage de seuil déjà atteint.
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── B.7 — ZONE DANGEREUSE (RGPD) ─── */}
      <div 
        className="rounded-[16px] p-6"
        style={{ 
          background: 'rgba(239,68,68,0.04)', 
          border: '1px solid rgba(239,68,68,0.20)'
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">🚫</span>
          <span 
            className="text-[12px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: '#ef4444' }}
          >
            Zone dangereuse
          </span>
        </div>

        <p 
          className="text-[13px] leading-[1.6] mb-4"
          style={{ color: 'var(--eaf-text-secondary)' }}
        >
          Conformément au RGPD (article 17), tu peux demander la suppression définitive de ton compte et de toutes tes données.
          Cette action est irréversible.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold transition-all"
            style={{ 
              background: 'transparent',
              border: '1px solid rgba(239,68,68,0.40)',
              color: '#f87171'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.60)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.40)';
            }}
          >
            <Trash2 className="h-4 w-4 inline mr-2" />
            Supprimer mon compte
          </button>
        ) : (
          <div 
            className="space-y-3 rounded-xl p-4"
            style={{ 
              background: 'rgba(239,68,68,0.08)', 
              border: '1px solid rgba(239,68,68,0.30)'
            }}
          >
            <p 
              className="text-sm font-semibold"
              style={{ color: '#ef4444' }}
            >
              Confirme la suppression en saisissant ton adresse e-mail :
            </p>
            <input
              type="email"
              value={deleteEmail}
              onChange={(e) => { setDeleteEmail(e.target.value); setDeleteError(null); }}
              placeholder="ton-email@exemple.com"
              style={{
                ...inputStyle,
                border: '1px solid rgba(239,68,68,0.30)',
              }}
            />
            {deleteError && (
              <p className="text-xs font-medium" style={{ color: '#ef4444' }}>{deleteError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteEmail(''); setDeleteError(null); }}
                disabled={deletingAccount}
                className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all disabled:opacity-60"
                style={{ 
                  background: 'transparent',
                  border: '1px solid var(--eaf-border)',
                  color: 'var(--eaf-text-secondary)'
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deletingAccount || !deleteEmail.trim()}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: '#dc2626' }}
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
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
