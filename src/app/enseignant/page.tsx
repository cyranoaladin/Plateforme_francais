'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  GraduationCap,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type StudentItem = {
  id: string;
  displayName: string;
  email: string;
  averageScore: number;
  lastActivity: string | null;
  nextMockExam: string | null;
};

type DistributionItem = {
  label: string;
  count: number;
};

type CopyItem = {
  copieId: string;
  studentName: string;
  epreuveType: string;
  note: number | null;
  status: string;
  createdAt: string;
  teacherComment?: string;
};

type DashboardPayload = {
  classCode: string | null;
  students: StudentItem[];
  distribution: DistributionItem[];
  copies: CopyItem[];
};

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDay(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function statusLabel(status: string) {
  if (status === 'done') return 'Terminée';
  if (status === 'error') return 'Erreur';
  if (status === 'processing') return 'En traitement';
  return 'En attente';
}

function statusStyle(status: string) {
  if (status === 'done') return 'border-[var(--c-success)]/16 bg-[var(--surface-teal-light)] text-[var(--c-success)]';
  if (status === 'error') return 'border-[var(--c-accent-text)]/18 bg-[var(--c-accent-subtle)] text-[var(--c-accent-text)]';
  if (status === 'processing') return 'border-[var(--c-primary)]/14 bg-[var(--surface-navy-light)] text-[var(--c-primary)]';
  return 'border-[var(--color-amber-300)]/18 bg-[var(--surface-premium)] text-[var(--warning-text)]';
}

export default function EnseignantPage() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/enseignant/dashboard');
      if (response.status === 401 || response.status === 403) {
        throw new Error('Accès enseignant indisponible pour cette session.');
      }
      if (!response.ok) {
        throw new Error('Impossible de charger les données enseignant.');
      }

      const nextPayload = (await response.json()) as DashboardPayload;
      setPayload(nextPayload);
      setCommentDrafts(
        Object.fromEntries(nextPayload.copies.map((item) => [item.copieId, item.teacherComment ?? ''])),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
      setPayload(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const classAverage = useMemo(() => {
    const students = payload?.students ?? [];
    if (students.length === 0) return 0;
    return Number((students.reduce((sum, item) => sum + item.averageScore, 0) / students.length).toFixed(1));
  }, [payload?.students]);

  const atRiskCount = useMemo(
    () => (payload?.students ?? []).filter((student) => student.averageScore < 10).length,
    [payload?.students],
  );

  const nextMockExam = useMemo(() => {
    const dates = (payload?.students ?? [])
      .map((student) => student.nextMockExam)
      .filter((value): value is string => Boolean(value))
      .sort();
    return dates[0] ?? null;
  }, [payload?.students]);

  const totalCopies = payload?.copies.length ?? 0;
  const correctedCopies = (payload?.copies ?? []).filter((copy) => copy.status === 'done').length;
  const distributionMax = Math.max(...((payload?.distribution ?? []).map((item) => item.count)), 1);

  const generateClassCode = async () => {
    const response = await fetch('/api/v1/enseignant/class-code', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': getCsrfTokenFromDocument(),
      },
    });

    if (!response.ok) {
      setError('Échec de génération du code classe.');
      return;
    }

    await load();
  };

  const saveComment = async (copieId: string) => {
    const value = commentDrafts[copieId]?.trim();
    if (!value) return;

    const response = await fetch(`/api/v1/enseignant/corrections/${copieId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfTokenFromDocument(),
      },
      body: JSON.stringify({ comment: value }),
    });

    if (!response.ok) {
      setError('Échec d’enregistrement du commentaire.');
      return;
    }

    await load();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--c-primary)] p-6 text-[var(--bg-page)] shadow-[var(--shadow-md)] md:p-8 lg:p-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_70%)] blur-2xl lg:block" />
        <div className="absolute left-[-6%] top-[-18%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">
              <ShieldCheck className="h-4 w-4" />
              Espace enseignant
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-6 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              La vue enseignant doit permettre de piloter la classe, pas de fouiller les données une par une.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
              Code classe, niveau moyen, élèves à surveiller, repères de progression, copies corrigées et commentaires&nbsp;: tout doit rester lisible et
              actionnable depuis un seul écran.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => void generateClassCode()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--bg-page)] px-6 py-3.5 text-sm font-bold text-[var(--c-primary)] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                Générer un code classe
                <Sparkles className="h-4 w-4" />
              </button>
              <a
                href="/api/v1/enseignant/export"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 px-6 py-3.5 text-sm font-semibold text-[var(--bg-page)] transition-colors hover:bg-white/6"
              >
                Export CSV
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {[
              { label: 'Code classe', value: payload?.classCode ?? 'Non défini', icon: ShieldCheck },
              { label: 'Élèves', value: `${payload?.students.length ?? 0}`, icon: Users },
              { label: 'Moyenne classe', value: `${classAverage} / 20`, icon: GraduationCap },
              { label: 'Copies corrigées', value: `${correctedCopies} / ${totalCopies}`, icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[var(--color-amber-300)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                    <p className="mt-1 text-xl font-bold text-white">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="sm:col-span-2 rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-amber-300)]">Lecture rapide</p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {atRiskCount > 0 ? `${atRiskCount} élève${atRiskCount > 1 ? 's' : ''} à resserrer` : 'Aucun signal critique immédiat'}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-200">
                {nextMockExam
                  ? `Prochaine échéance détectée autour du ${formatDay(nextMockExam)}. Les commentaires enseignants doivent soutenir cette fenêtre.`
                  : 'Aucune prochaine épreuve blanche remontée. Le tableau est centré sur le suivi courant de la classe.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[24px] border border-[var(--c-accent-text)]/25 bg-[var(--c-accent-subtle)] p-4 text-sm text-[var(--c-accent-text)] shadow-[var(--shadow-sm)]" role="alert">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 text-sm text-[var(--text-muted)] shadow-[var(--shadow-md)]" role="status">
          Chargement de l'espace enseignant...
        </div>
      ) : null}

      {!isLoading && payload ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Roster classe</p>
                  <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
                    Les élèves doivent être lisibles sans perdre la vue d’ensemble.
                  </h2>
                </div>
                <button
                  onClick={() => void load()}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 py-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:border-[var(--c-success)] hover:text-[var(--c-success)]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </button>
              </div>

              <div className="mt-8 overflow-hidden rounded-[24px] border border-[var(--border-strong)]">
                <div className="grid grid-cols-[1.4fr_1.6fr_0.9fr_1fr_1fr] gap-3 bg-[var(--bg-surface-secondary)] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  <span>Élève</span>
                  <span>Email</span>
                  <span>Score</span>
                  <span>Dernière activité</span>
                  <span>Prochaine échéance</span>
                </div>
                <div className="divide-y divide-[var(--border-strong)] bg-[var(--bg-surface)]">
                  {payload.students.length > 0 ? (
                    payload.students.map((student) => (
                      <div key={student.id} className="grid grid-cols-[1.4fr_1.6fr_0.9fr_1fr_1fr] gap-3 px-4 py-4 text-sm text-[var(--text-body)]">
                        <div>
                          <p className="font-semibold text-[var(--c-primary)]">{student.displayName}</p>
                        </div>
                        <p className="truncate text-[var(--text-muted)]">{student.email}</p>
                        <p className={`font-semibold ${student.averageScore < 10 ? 'text-[var(--c-accent-text)]' : 'text-[var(--c-primary)]'}`}>
                          {student.averageScore} / 20
                        </p>
                        <p className="text-[var(--text-muted)]">{formatDateTime(student.lastActivity)}</p>
                        <p className="text-[var(--text-muted)]">{formatDay(student.nextMockExam)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-[var(--text-muted)]">Aucun élève rattaché à cette classe pour le moment.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Distribution des notes</p>
                <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
                  Une lecture directe de la répartition suffit souvent à orienter la prochaine séquence.
                </h2>

                <div className="mt-8 space-y-4">
                  {payload.distribution.length > 0 ? (
                    payload.distribution.map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
                          <span className="text-[var(--c-primary)]">{item.label}</span>
                          <span className="text-[var(--text-muted)]">{item.count} élève{item.count > 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-3 rounded-full bg-[var(--border-default)]">
                          <div
                            className="h-3 rounded-full bg-[var(--c-primary)]"
                            style={{ width: `${(item.count / distributionMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4 text-sm leading-7 text-[var(--text-secondary)]">
                      Aucune distribution disponible tant que les copies corrigées restent absentes.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--c-primary)] bg-[var(--c-primary)] p-6 text-[var(--bg-page)] shadow-[var(--shadow-md)] md:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">Pilotage rapide</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {[
                    {
                      title: 'Élèves à soutenir',
                      value: `${atRiskCount}`,
                      detail: 'Moyenne strictement sous 10/20 dans les données remontées.',
                      icon: AlertTriangle,
                    },
                    {
                      title: 'Prochaine échéance',
                      value: nextMockExam ? formatDay(nextMockExam) : '—',
                      detail: 'Première date d’épreuve blanche détectée dans la classe.',
                      icon: CalendarDays,
                    },
                    {
                      title: 'Copies ouvertes',
                      value: `${totalCopies - correctedCopies}`,
                      detail: 'Travail restant avant fermeture complète du lot actuel.',
                      icon: ClipboardList,
                    },
                    {
                      title: 'Commentaires',
                      value: `${Object.values(commentDrafts).filter((value) => value.trim().length > 0).length}`,
                      detail: 'Brouillons de retours enseignants actuellement présents.',
                      icon: MessageSquare,
                    },
                  ].map((item) => (
                    <article key={item.title} className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[var(--color-amber-300)]">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-2xl font-bold text-white">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{item.detail}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Copies corrigées</p>
                <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
                  Les retours enseignants doivent rester rapides à écrire et simples à relire.
                </h2>
              </div>
              <div className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
                {payload.copies.length} copie{payload.copies.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {payload.copies.length > 0 ? (
                payload.copies.map((copy) => (
                  <article key={copy.copieId} className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-paper)] p-5 shadow-[var(--shadow-sm)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-[var(--c-primary)]">{copy.studentName}</span>
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${statusStyle(copy.status)}`}>
                            {statusLabel(copy.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                          {copy.epreuveType} · {formatDateTime(copy.createdAt)}
                        </p>
                      </div>
                      <div className="rounded-[16px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                        <p className="font-semibold text-[var(--c-primary)]">Note</p>
                        <p className="mt-1 text-lg font-bold text-[var(--c-primary)]">{copy.note ?? '—'} / 20</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <textarea
                        value={commentDrafts[copy.copieId] ?? ''}
                        onChange={(event) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [copy.copieId]: event.target.value,
                          }))
                        }
                        className="min-h-24 w-full rounded-[16px] border border-[var(--border-strong)] bg-[var(--surface-paper)] p-4 text-sm text-[var(--c-primary)] outline-none transition-colors focus:border-[var(--c-success)]"
                        placeholder="Ajouter un commentaire enseignant..."
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)]">
                        <BookMarked className="h-3.5 w-3.5" />
                        Retour ciblé et lisible par l’élève
                      </div>
                      <button
                        onClick={() => void saveComment(copy.copieId)}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--c-primary)] px-4 py-2 text-sm font-semibold text-[var(--bg-page)] transition-all hover:-translate-y-0.5"
                      >
                        Enregistrer
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4 text-sm leading-7 text-[var(--text-secondary)]">
                  Aucune copie corrigée n’est encore disponible dans ce tableau.
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
