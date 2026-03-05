'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2, Download, Flame } from 'lucide-react';
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

const PROCESSING_STEPS = [
  'Lecture de la copie...',
  'Analyse litteraire...',
  'Redaction du bilan...',
];

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

    let polling: NodeJS.Timeout | null = null;

    const load = async () => {
      const response = await fetch(`/api/v1/epreuves/${epreuveId}/copie/${params.copieId}`);
      if (!response.ok) {
        setError('Impossible de charger la correction.');
        return;
      }

      const data = (await response.json()) as CorrectionPayload;
      setPayload(data);

      if (data.status === 'pending' || data.status === 'processing') {
        polling = setTimeout(load, 3000);
      } else if (data.status === 'done') {
        await fetch(`/api/v1/epreuves/copies/${params.copieId}/report`).catch(() => undefined);
      }
    };

    void load();

    return () => {
      if (polling) {
        clearTimeout(polling);
      }
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
    if (!correction) {
      return [];
    }
    return mapAnnotationsToRegions(payload?.ocrText, correction.annotations);
  }, [correction, payload?.ocrText]);

  const noteColor = useMemo(() => {
    if (note >= 15) return 'bg-success/20 text-success border-success/40';
    if (note >= 10) return 'bg-warning/20 text-warning border-warning/40';
    return 'bg-error/20 text-error border-error/40';
  }, [note]);

  if (error) {
    return <div className="p-8 text-error">{error}</div>;
  }

  if (!payload || payload.status === 'pending' || payload.status === 'processing') {
    return (
      <div className="p-10 max-w-3xl mx-auto space-y-4" role="status">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Analyse IA en cours...</span>
        </div>
        <div className="space-y-2">
          {PROCESSING_STEPS.map((step, idx) => (
            <div key={step} className={`text-sm ${idx === stepIndex ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
              {idx + 1}. {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (payload.status === 'error' || !correction) {
    return <div className="p-8 text-error">La correction n'a pas pu être générée.</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border border-border bg-card p-6">
        <div>
          <h1 className="text-2xl font-bold">Rapport de correction</h1>
          <p className="text-muted-foreground mt-1">Copie {payload.copieId}</p>
        </div>
        <div className={`px-4 py-3 border rounded-xl ${noteColor} animate-pulse`}>
          <p className="text-xs uppercase font-semibold tracking-wide">Note finale</p>
          <p className="text-3xl font-bold">{correction.note}/20</p>
          <p className="text-sm">{correction.mention}</p>
        </div>
      </header>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-2">Bilan global</h2>
        <p className="text-sm text-foreground/90">{correction.bilan.global}</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Rubriques</h2>
        <div className="space-y-4">
          {correction.rubriques.map((item) => {
            const width = Math.max(0, Math.min(100, Math.round((item.note / item.max) * 100)));
            return (
              <div key={`${item.titre}-${item.max}`} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.titre}</span>
                  <span>{item.note}/{item.max}</span>
                </div>
                <div className="h-2 bg-muted rounded">
                  <div className="h-2 rounded bg-primary" style={{ width: `${width}%` }}></div>
                </div>
                <p className="text-xs text-muted-foreground">{item.appreciation}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Annotations ciblées</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            {correction.annotations.map((item, index) => {
              const selected = index === activeAnnotation;
              return (
                <button
                  key={`${item.extrait}-${index}`}
                  type="button"
                  onClick={() => setActiveAnnotation(index)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <p className="text-sm font-medium">« {item.extrait} »</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.commentaire}</p>
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3">
            {isImageCopy && imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="Copie manuscrite" className="w-full rounded-md border border-border" />
                <div className="absolute inset-0 pointer-events-none">
                  {annotationRegions.map((region, idx) => {
                    const selected = idx === activeAnnotation;
                    return (
                      <div
                        key={`region-${idx}`}
                        className={`absolute rounded-md border-2 transition-all ${
                          selected
                            ? 'border-primary bg-primary/15 shadow-md'
                            : 'border-amber-500/70 bg-amber-200/20'
                        }`}
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
              <p className="text-sm text-muted-foreground">
                Aperçu visuel indisponible pour ce format de copie.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <details>
          <summary className="cursor-pointer font-semibold">Voir le corrigé type</summary>
          <p className="mt-3 text-sm whitespace-pre-line">{correction.corrige_type}</p>
        </details>
      </section>

      <section className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <h2 className="font-semibold flex items-center gap-2"><Flame className="w-4 h-4" /> Lettre du professeur</h2>
        <p className="mt-2 text-sm whitespace-pre-line">{correction.conseil_final}</p>
      </section>

      <a
        href={`/api/v1/epreuves/copies/${payload.copieId}/report`}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium"
      >
        <Download className="w-4 h-4" /> Télécharger mon rapport PDF
      </a>
    </div>
  );
}
