'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Download, Flame, Loader2, Quote, Sparkles, Target } from 'lucide-react';
import { mapAnnotationsToRegions } from '@/lib/correction/annotation-mapper';

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
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

const PROCESSING_STEPS = ['Lecture de la copie...', 'Analyse litteraire...', 'Redaction du bilan...'];

const ANNOTATION_STYLES = {
  erreur: 'border-[#f1c8c0] bg-[#fff0ed] text-[#b24838]',
  remarque: 'border-[#dfd1bc] bg-[#fffaf4] text-[#7a6858]',
  bravo: 'border-[#d6e8df] bg-[#edf7f3] text-[#0f766e]',
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
    if (note >= 15) return 'border-[#d6e8df] bg-[#edf7f3] text-[#0f766e]';
    if (note >= 10) return 'border-[#efd9b4] bg-[#fff7ea] text-[#af7a20]';
    return 'border-[#f1c8c0] bg-[#fff0ed] text-[#b24838]';
  }, [note]);

  if (error) {
    return <div className="mx-auto max-w-5xl p-8 text-sm text-[#b24838]">{error}</div>;
  }

  if (!payload || payload.status === 'pending' || payload.status === 'processing') {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10" role="status">
        <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#17324d] px-6 py-8 text-[#f7f2ea] shadow-[0_28px_90px_rgba(23,50,77,0.22)] md:px-8 md:py-10">
          <div className="absolute inset-y-0 right-[-10%] hidden w-[40%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.22),_transparent_70%)] blur-2xl lg:block" />
          <div className="absolute left-[-6%] top-[-22%] h-40 w-40 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
              <Sparkles className="h-4 w-4" />
              Rapport en préparation
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl">
              Le rapport de correction est en train d être composé.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#dfe8f0] md:text-base">
              La plateforme relit la copie, structure les rubriques, ancre les annotations et prépare un bilan exploitable pour la séance suivante.
            </p>
          </div>
        </section>

        <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[0_20px_70px_rgba(23,50,77,0.08)] md:p-7">
          <div className="flex items-center gap-3 text-[#17324d]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-semibold">Rapport de correction en cours...</span>
          </div>
          <div className="mt-6 space-y-3">
            {PROCESSING_STEPS.map((step, index) => (
              <div
                key={step}
                className={`rounded-[20px] border px-4 py-4 text-sm transition ${index === stepIndex ? 'border-[#17324d]/18 bg-white text-[#17324d] shadow-[0_10px_24px_rgba(23,50,77,0.06)]' : 'border-[#eadbc5] bg-[#fbf5ec] text-[#6d7e8d]'}`}
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
    return <div className="mx-auto max-w-5xl p-8 text-sm text-[#b24838]">La correction n'a pas pu être générée.</div>;
  }

  const activeAnnotationItem = correction.annotations[activeAnnotation];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#17324d] px-6 py-7 text-[#f7f2ea] shadow-[0_32px_90px_rgba(23,50,77,0.22)] md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.22),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
              <Sparkles className="h-4 w-4" />
              Rapport de correction
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              La copie est relue comme un objet de progression, pas comme une simple note finale.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#dfe8f0] md:text-base">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">Rubriques</p>
              <p className="mt-2 text-3xl font-semibold text-white">{correction.rubriques.length}</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">Annotations</p>
              <p className="mt-2 text-3xl font-semibold text-white">{correction.annotations.length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="space-y-6">
          <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[0_20px_70px_rgba(23,50,77,0.08)] md:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17324d]/8 text-[#17324d]">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Vue d ensemble</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[#17324d]">
                  Bilan global
                </h2>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[#33536f]">{correction.bilan.global}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-[#d6e8df] bg-[#edf7f3] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0f766e]">Points forts</p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-[#33536f]">
                  {correction.bilan.points_forts.map((item) => (
                    <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#0f766e]" /> <span>{item}</span></li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[22px] border border-[#efd9b4] bg-[#fff7ea] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#af7a20]">Axes d amélioration</p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-[#6b5735]">
                  {correction.bilan.axes_amelioration.map((item) => (
                    <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#af7a20]" /> <span>{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[0_20px_70px_rgba(23,50,77,0.08)] md:p-7">
            <h2 className="text-lg font-semibold text-[#17324d]">Rubriques</h2>
            <div className="mt-5 space-y-4">
              {correction.rubriques.map((item) => {
                const width = Math.max(0, Math.min(100, Math.round((item.note / item.max) * 100)));
                return (
                  <article key={`${item.titre}-${item.max}`} className="rounded-[22px] border border-[#eadbc5] bg-white p-4 shadow-[0_10px_24px_rgba(23,50,77,0.05)]">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-[#17324d]">{item.titre}</span>
                      <span className="font-semibold text-[#17324d]">{item.note}/{item.max}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0e6d8]">
                      <div className="h-2 rounded-full bg-[#17324d]" style={{ width: `${width}%` }} />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#5d7287]">{item.appreciation}</p>
                    {item.conseils.length > 0 && (
                      <ul className="mt-3 space-y-2 text-xs leading-6 text-[#6d7e8d]">
                        {item.conseils.map((conseil) => (
                          <li key={conseil} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#b87333]" /> <span>{conseil}</span></li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[0_20px_70px_rgba(23,50,77,0.08)] md:p-7">
            <details>
              <summary className="cursor-pointer text-lg font-semibold text-[#17324d]">Voir le corrigé type</summary>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#33536f]">{correction.corrige_type}</p>
            </details>
          </section>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[30px] border border-[#d8e8e3] bg-[#edf7f3] p-6 shadow-[0_18px_55px_rgba(15,118,110,0.08)] md:p-7">
            <h2 className="text-lg font-semibold text-[#17324d]">Annotations ciblées</h2>
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
                      className={`w-full rounded-[20px] border px-4 py-4 text-left text-sm transition ${selected ? 'border-[#17324d]/18 bg-white shadow-[0_12px_24px_rgba(23,50,77,0.06)]' : 'border-[#d3e7e1] bg-white/80'} `}
                    >
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${tone}`}>
                        {item.type}
                      </span>
                      <p className="mt-3 font-semibold leading-6 text-[#17324d]">« {item.extrait} »</p>
                      <p className="mt-2 leading-7 text-[#5d7287]">{item.commentaire}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-[24px] border border-[#d3e7e1] bg-white p-4 shadow-[0_10px_24px_rgba(15,118,110,0.05)]">
                {isImageCopy && imageUrl ? (
                  <div className="relative overflow-hidden rounded-[18px] border border-[#eadbc5] bg-[#fbf5ec]">
                    <img src={imageUrl} alt="Copie manuscrite" className="w-full" />
                    <div className="pointer-events-none absolute inset-0">
                      {annotationRegions.map((region, idx) => {
                        const selected = idx === activeAnnotation;
                        return (
                          <div
                            key={`region-${idx}`}
                            className={`absolute rounded-md border-2 transition-all ${selected ? 'border-[#17324d] bg-[#17324d]/12 shadow-md' : 'border-[#b87333]/70 bg-[#f4d6b8]/18'}`}
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
                  <div className="rounded-[18px] border border-[#eadbc5] bg-[#fffaf4] p-4 text-sm leading-7 text-[#5d7287]">
                    Aperçu visuel indisponible pour ce format de copie.
                  </div>
                )}

                {activeAnnotationItem && (
                  <div className="mt-4 rounded-[18px] border border-[#eadbc5] bg-[#fffaf4] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a6a37]">Annotation active</p>
                    <p className="mt-3 text-sm font-semibold text-[#17324d]">{activeAnnotationItem.extrait}</p>
                    <p className="mt-2 text-sm leading-7 text-[#5d7287]">{activeAnnotationItem.commentaire}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#efd9b4] bg-[#fff7ea] p-6 shadow-[0_18px_55px_rgba(175,122,32,0.08)] md:p-7">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#17324d]"><Flame className="h-5 w-5 text-[#af7a20]" /> Lettre du professeur</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#6b5735]">{correction.conseil_final}</p>
          </section>

          <section className="rounded-[28px] border border-[#e7dac6] bg-white p-5 shadow-[0_18px_55px_rgba(23,50,77,0.06)]">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#17324d]/8 text-[#17324d]">
                <Quote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#17324d]">Exporter et retravailler</p>
                <p className="mt-2 text-sm leading-7 text-[#5d7287]">
                  Le meilleur usage de ce rapport n est pas de le lire une fois. Télécharge-le, isole deux axes, puis réinjecte-les dans la prochaine copie ou dans le tuteur.
                </p>
              </div>
            </div>
            <a
              href={`/api/v1/epreuves/copies/${payload.copieId}/report`}
              className="mt-5 inline-flex items-center gap-2 rounded-[18px] bg-[#17324d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#244a6d]"
            >
              <Download className="h-4 w-4" /> Télécharger mon rapport PDF
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
