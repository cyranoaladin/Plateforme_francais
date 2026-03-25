'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AlertTriangle, Download, Flame, Loader2, Quote, Sparkles, Target } from 'lucide-react';
import { mapAnnotationsToRegions } from '@/lib/correction/annotation-mapper';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';
import { Button } from '@/components/ui';
import { StateNotice } from '@/components/ui/state-notice';

type CorrectionPayload = {
  copieId: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  ocrText?: string | null;
  fileType?: string;
  correction: {
    note: number;
    mention: string;
    bilan: {
      global: string;
      points_forts: string[];
      axes_amelioration: string[];
    };
    rubriques: {
      titre: string;
      note: number;
      max: number;
      appreciation: string;
      conseils: string[];
    }[];
    annotations: {
      extrait: string;
      commentaire: string;
      type: 'erreur' | 'remarque' | 'bravo';
    }[];
    corrige_type: string;
    conseil_final: string;
  } | null;
};

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const PROCESSING_STEPS = ['Lecture de la copie...', 'Analyse littéraire...', 'Rédaction du bilan...'];

const ANNOTATION_STYLES = {
  erreur: 'border-[var(--border-accent)] bg-[var(--c-accent-subtle)] text-[var(--c-accent-text)]',
  remarque: 'border-[var(--border-default)] bg-[var(--bg-surface-secondary)] text-[var(--text-body)]',
  bravo: 'border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-success)]',
};

export default function CorrectionCopiePage() {
  const params = useParams<{ copieId: string }>();
  const searchParams = useSearchParams();
  const epreuveId = searchParams.get('epreuveId');

  const [payload, setPayload] = useState<CorrectionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeAnnotation, setActiveAnnotation] = useState<number>(0);

  useEffect(() => {
    if (!params.copieId || !epreuveId) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`/api/v1/epreuves/${epreuveId}/copie/${params.copieId}`);
        if (!response.ok) {
          throw new Error('Impossible de charger la correction.');
        }

        const data = (await response.json()) as CorrectionPayload;
        if (cancelled) return;
        setPayload(data);

        if (data.status === 'pending' || data.status === 'processing') {
          timeoutId = setTimeout(load, 3000);
        } else if (data.status === 'done') {
          await fetch(`/api/v1/epreuves/copies/${params.copieId}/report`).catch(() => undefined);
        }
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : 'Impossible de charger la correction.');
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [epreuveId, params.copieId]);

  useEffect(() => {
    if (!payload || (payload.status !== 'pending' && payload.status !== 'processing')) {
      return;
    }
    const id = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % PROCESSING_STEPS.length);
    }, 1500);
    return () => clearInterval(id);
  }, [payload]);

  const correction = payload?.correction;
  const note = correction?.note ?? 0;
  const imageUrl = payload ? `/api/v1/epreuves/copies/${payload.copieId}/file` : null;
  const isImageCopy = Boolean(payload?.fileType?.startsWith('image/'));

  const annotationRegions = useMemo(() => {
    if (!correction) return [];
    return mapAnnotationsToRegions(payload?.ocrText, correction.annotations);
  }, [correction, payload?.ocrText]);

  const noteTone = useMemo(() => {
    if (note >= 15) return 'border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-success)]';
    if (note >= 10) return 'border-[var(--border-reward)] bg-[var(--bg-reward)] text-[var(--c-reward)]';
    return 'border-[var(--border-accent)] bg-[var(--c-accent-subtle)] text-[var(--c-accent-text)]';
  }, [note]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <StateNotice
          title="Impossible de charger la correction"
          description={`${error} Rafraîchis la page ou réessaie dans quelques instants.`}
          variant="error"
          icon={AlertTriangle}
        />
      </div>
    );
  }

  if (!payload || payload.status === 'pending' || payload.status === 'processing') {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10" role="status">
        <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--c-primary)] px-6 py-8 text-[var(--bg-page)] shadow-[var(--shadow-md)] md:px-8 md:py-10">
          <div className="absolute inset-y-0 right-[-10%] hidden w-[40%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.22),_transparent_70%)] blur-2xl lg:block" />
          <div className="absolute left-[-6%] top-[-22%] h-40 w-40 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">
              <Sparkles className="h-4 w-4" />
              Rapport en préparation
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl">
              Le rapport de correction est en train d’être composé.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-slate-300)] md:text-base">
              La plateforme relit la copie, structure les rubriques, ancre les annotations et prépare un bilan exploitable pour la séance suivante.
            </p>
          </div>
        </section>

        <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
          <div className="flex items-center gap-3 text-[var(--c-primary)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-semibold">Rapport de correction en cours...</span>
          </div>
          <div className="mt-6 space-y-3">
            {PROCESSING_STEPS.map((step, index) => (
              <div
                key={step}
                className={`rounded-[16px] border px-4 py-4 text-sm transition ${index === stepIndex ? 'border-[var(--c-primary)]/18 bg-[var(--bg-surface)] text-[var(--c-primary)] shadow-[var(--shadow-sm)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)]'}`}
              >
                {index + 1}. {step}
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (payload.status === 'error' || !correction) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <StateNotice
          title="La correction n’a pas pu être générée"
          description="L’analyse de ta copie a rencontré un problème. Tu peux retourner à l’atelier écrit pour déposer à nouveau ta copie."
          variant="error"
          icon={AlertTriangle}
          action={
            <a
              href="/atelier-ecrit"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--c-primary)] transition hover:border-[var(--c-success)] hover:text-[var(--c-success)]"
            >
              Retour à l’atelier écrit
            </a>
          }
        />
      </div>
    );
  }

  const activeAnnotationItem = correction.annotations[activeAnnotation];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--c-primary)] px-6 py-7 text-[var(--bg-page)] shadow-[var(--shadow-md)] md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.22),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">
              <Sparkles className="h-4 w-4" />
              Rapport de correction
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              La copie est relue comme un objet de progression, pas comme une simple note finale.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-slate-300)] md:text-base">
              Rubriques, annotations, corrigé type et lettre finale sont réunis dans un seul écran pour transformer le retour en prochain travail utile.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className={`rounded-[24px] border px-4 py-4 backdrop-blur-sm ${noteTone}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Note finale</p>
              <p className="mt-2 text-3xl font-semibold">{correction.note}/20</p>
              <p className="text-sm">{correction.mention}</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-amber-300)]">Rubriques</p>
              <p className="mt-2 text-3xl font-semibold text-white">{correction.rubriques.length}</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-amber-300)]">Annotations</p>
              <p className="mt-2 text-3xl font-semibold text-white">{correction.annotations.length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="space-y-6">
          <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Vue d’ensemble</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Bilan global
                </h2>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[var(--text-body)]">{sanitizeLlmText(correction.bilan.global)}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-[var(--border-success)] bg-[var(--bg-success)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-success)]">Points forts</p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--text-body)]">
                  {correction.bilan.points_forts.map((item) => (
                    <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--c-success)]" /> <span>{sanitizeLlmText(item)}</span></li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[22px] border border-[var(--border-reward)] bg-[var(--bg-reward)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-reward)]">Axes d’amélioration</p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--text-reward-on-subtle)]">
                  {correction.bilan.axes_amelioration.map((item) => (
                    <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--c-reward)]" /> <span>{sanitizeLlmText(item)}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Détail par rubrique</p>
                <h2 className="text-lg font-semibold text-[var(--c-primary)]">Rubriques</h2>
              </div>
            </div>
            <div className="mt-5 space-y-5">
              {correction.rubriques.map((item) => {
                const pct = Math.max(0, Math.min(100, Math.round((item.note / item.max) * 100)));
                const barColor = pct >= 75 ? 'bg-[var(--c-success)]' : pct >= 50 ? 'bg-[var(--c-reward)]' : 'bg-[var(--c-accent-text)]';
                const scoreColor = pct >= 75 ? 'text-[var(--c-success)]' : pct >= 50 ? 'text-[var(--c-reward)]' : 'text-[var(--c-accent-text)]';
                return (
                  <article key={`${item.titre}-${item.max}`} className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[var(--c-primary)]">{item.titre}</span>
                      <span className={`rounded-full border px-3 py-1 text-sm font-bold ${scoreColor} ${pct >= 75 ? 'border-[var(--border-success)] bg-[var(--bg-success)]' : pct >= 50 ? 'border-[var(--border-reward)] bg-[var(--bg-reward)]' : 'border-[var(--border-accent)] bg-[var(--c-accent-subtle)]'}`}>
                        {item.note}/{item.max}
                      </span>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--bg-surface-secondary)]">
                      <div className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--text-body)]">{sanitizeLlmText(item.appreciation)}</p>
                    {item.conseils.length > 0 && (
                      <div className="mt-4 rounded-[16px] border border-[var(--border-reward)] bg-[var(--bg-reward)] p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--c-reward)]">Conseils pour progresser</p>
                        <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--text-reward-on-subtle)]">
                          {item.conseils.map((conseil) => (
                            <li key={conseil} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--c-reward)]" /> <span>{sanitizeLlmText(conseil)}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          {correction.corrige_type && (
            <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-success)]/8 text-[var(--c-success)]">
                  <Quote className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Plan de référence</p>
                  <h2 className="text-lg font-semibold text-[var(--c-primary)]">Corrigé type</h2>
                </div>
              </div>
              <div className="mt-5 whitespace-pre-line rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 text-sm leading-7 text-[var(--text-body)]">
                {sanitizeLlmText(correction.corrige_type)}
              </div>
              <p className="mt-3 text-xs italic text-[var(--text-muted)]">
                Ce plan indicatif montre une structure possible — il ne constitue pas l'unique réponse valide.
              </p>
            </section>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[var(--c-primary)]">Annotations ciblées</h2>
              <span className="rounded-full bg-[var(--c-success)]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--c-success)]">
                {correction.annotations.length} annotation{correction.annotations.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
              <div className="space-y-3">
                {correction.annotations.map((item, index) => {
                  const selected = index === activeAnnotation;
                  const tone = ANNOTATION_STYLES[item.type];
                  return (
                    <button
                      key={`${item.extrait}-${index}`}
                      type="button"
                      onClick={() => setActiveAnnotation(index)}
                      className={`w-full rounded-[16px] border px-4 py-4 text-left text-sm transition ${selected ? 'border-[var(--c-primary)]/18 bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]' : 'border-[var(--border-success)] bg-[var(--bg-surface)]/80'} `}
                    >
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${tone}`}>
                        {item.type}
                      </span>
                      <p className="mt-3 font-semibold leading-6 text-[var(--c-primary)]">« {sanitizeLlmText(item.extrait)} »</p>
                      <p className="mt-2 leading-7 text-[var(--text-secondary)]">{sanitizeLlmText(item.commentaire)}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)]">
                {isImageCopy && imageUrl ? (
                  <div className="relative overflow-hidden rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface)]">
                    <img src={imageUrl} alt="Copie manuscrite" className="w-full" />
                    <div className="pointer-events-none absolute inset-0">
                      {annotationRegions.map((region, idx) => {
                        const selected = idx === activeAnnotation;
                        return (
                          <div
                            key={`region-${idx}`}
                            className={`absolute rounded-md border-2 transition-all ${selected ? 'border-[var(--c-primary)] bg-[var(--c-primary)]/12 shadow-md' : 'border-[var(--color-amber-300)]/70 bg-[var(--bg-reward)]/18'}`}
                            style={{
                              top: `${region.topPct}%`,
                              left: `${region.leftPct}%`,
                              width: `${region.widthPct}%`,
                              height: `${region.heightPct}%`,
                              opacity: selected ? 1 : 0.55,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-4 text-sm leading-7 text-[var(--text-secondary)]">
                    Aperçu visuel indisponible pour ce format de copie.
                  </div>
                )}

                {activeAnnotationItem && (
                  <div className="mt-4 rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-reward)]">Annotation active</p>
                    <p className="mt-3 text-sm font-semibold text-[var(--c-primary)]">{sanitizeLlmText(activeAnnotationItem.extrait)}</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{sanitizeLlmText(activeAnnotationItem.commentaire)}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[24px] border border-[var(--border-reward)] bg-[var(--bg-reward)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="absolute right-[-8%] top-[-20%] h-32 w-32 rounded-full bg-[rgba(216,163,99,0.18)] blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-reward)]/12 text-[var(--c-reward)]">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Conseil personnalisé</p>
                  <h2 className="text-lg font-semibold text-[var(--c-primary)]">Lettre du professeur</h2>
                </div>
              </div>
              <div className="mt-5 rounded-[16px] border border-[var(--color-amber-300)]/30 bg-white/50 p-5">
                <p className="whitespace-pre-line text-sm leading-8 text-[var(--text-body)]">{sanitizeLlmText(correction.conseil_final)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Quote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--c-primary)]">Exporter et retravailler</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                  Le meilleur usage de ce rapport n’est pas de le lire une fois. Télécharge-le, isole deux axes, puis réinjecte-les dans la prochaine copie ou dans le tuteur.
                </p>
              </div>
            </div>
            <Button
              onClick={() => { window.location.href = `/api/v1/epreuves/copies/${payload.copieId}/report`; }}
              icon={<Download className="h-4 w-4" />}
              size="lg"
              className="mt-5 rounded-[16px] font-semibold"
            >
              Télécharger mon rapport PDF
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
