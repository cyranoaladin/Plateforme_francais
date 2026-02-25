'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2, Download, Flame } from 'lucide-react';

type CorrectionPayload = {
  copieId: string;
  status: 'pending' | 'processing' | 'done' | 'error';
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

export default function CorrectionCopiePage() {
  const params = useParams<{ copieId: string }>();
  const searchParams = useSearchParams();
  const epreuveId = searchParams.get('epreuveId');

  const [payload, setPayload] = useState<CorrectionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      }
    };

    void load();

    return () => {
      if (polling) {
        clearTimeout(polling);
      }
    };
  }, [epreuveId, params.copieId]);

  const correction = payload?.correction;
  const note = correction?.note ?? 0;

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
      <div className="p-10 max-w-3xl mx-auto flex items-center gap-3" role="status">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span>Correction en cours par l'IA…</span>
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
        <div className="space-y-3">
          {correction.annotations.map((item, index) => (
            <div key={`${item.extrait}-${index}`} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">« {item.extrait} »</p>
              <p className="text-sm text-muted-foreground mt-1">{item.commentaire}</p>
            </div>
          ))}
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
