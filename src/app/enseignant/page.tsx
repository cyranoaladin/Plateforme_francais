'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
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

type VitalsPayload = {
  vitals: Record<'LCP' | 'FID' | 'CLS', { count: number; avg: number; last: number }>;
};

export default function EnseignantPage() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [vitals, setVitals] = useState<VitalsPayload['vitals'] | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/enseignant/dashboard');
      if (!response.ok) {
        throw new Error('Impossible de charger les données enseignant.');
      }

      const nextPayload = (await response.json()) as DashboardPayload;
      setPayload(nextPayload);
      setCommentDrafts(
        Object.fromEntries(nextPayload.copies.map((item) => [item.copieId, item.teacherComment ?? ''])),
      );

      const vitalsResponse = await fetch('/api/v1/metrics/vitals');
      if (vitalsResponse.ok) {
        const vitalsPayload = (await vitalsResponse.json()) as VitalsPayload;
        setVitals(vitalsPayload.vitals);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
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
    if (!value) {
      return;
    }

    const response = await fetch(`/api/v1/enseignant/corrections/${copieId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfTokenFromDocument(),
      },
      body: JSON.stringify({ comment: value }),
    });

    if (!response.ok) {
      setError('Échec d enregistrement du commentaire.');
      return;
    }

    await load();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord enseignant</h1>
          <p className="text-muted-foreground mt-1">Suivi de progression de la classe et corrections IA en lecture seule.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={generateClassCode} className="px-4 py-2 rounded-lg border border-border bg-background">
            Générer un code classe
          </button>
          <a href="/api/v1/enseignant/export" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">
            Export CSV
          </a>
        </div>
      </header>

      {error && <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-error" role="alert">{error}</div>}

      {isLoading && <div className="rounded-lg border border-border bg-card p-4" role="status">Chargement du tableau enseignant…</div>}

      {!isLoading && payload && (
        <>
          <section className="grid md:grid-cols-3 gap-4">
            <article className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Code classe</p>
              <p className="text-2xl font-bold tracking-widest">{payload.classCode ?? 'Non défini'}</p>
            </article>
            <article className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Élèves rattachés</p>
              <p className="text-2xl font-bold">{payload.students.length}</p>
            </article>
            <article className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Score moyen classe</p>
              <p className="text-2xl font-bold">{classAverage}/20</p>
            </article>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-xl font-semibold">Progression des élèves</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3">Élève</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Score moyen</th>
                    <th className="py-2 pr-3">Dernière activité</th>
                    <th className="py-2 pr-3">Prochaine épreuve blanche</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.students.map((item) => (
                    <tr key={item.id} className="border-b border-border/70">
                      <td className="py-2 pr-3 font-medium">{item.displayName}</td>
                      <td className="py-2 pr-3">{item.email}</td>
                      <td className="py-2 pr-3">{item.averageScore}/20</td>
                      <td className="py-2 pr-3">{item.lastActivity ? new Date(item.lastActivity).toLocaleString('fr-FR') : '—'}</td>
                      <td className="py-2 pr-3">{item.nextMockExam ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold mb-3">Distribution des notes (épreuves blanches)</h2>
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payload.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-xl font-semibold">Copies corrigées</h2>
            <div className="space-y-3">
              {payload.copies.map((copy) => (
                <article key={copy.copieId} className="rounded-lg border border-border p-4 bg-background/70 space-y-3">
                  <div className="flex flex-wrap gap-3 justify-between">
                    <div>
                      <p className="font-semibold">{copy.studentName}</p>
                      <p className="text-sm text-muted-foreground">{copy.epreuveType} · {new Date(copy.createdAt).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Statut: {copy.status}</p>
                      <p className="font-bold">Note: {copy.note ?? '—'}</p>
                    </div>
                  </div>
                  <textarea
                    value={commentDrafts[copy.copieId] ?? ''}
                    onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [copy.copieId]: event.target.value }))}
                    className="w-full min-h-20 border border-input rounded-lg bg-background p-2"
                    placeholder="Ajouter un commentaire enseignant..."
                  />
                  <div>
                    <button onClick={() => void saveComment(copy.copieId)} className="px-3 py-2 rounded-lg border border-border bg-background">
                      Enregistrer le commentaire
                    </button>
                  </div>
                </article>
              ))}
              {payload.copies.length === 0 && <p className="text-sm text-muted-foreground">Aucune copie corrigée disponible.</p>}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-xl font-semibold">Santé de la plateforme</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {(['LCP', 'FID', 'CLS'] as const).map((key) => (
                <article key={key} className="rounded-lg border border-border p-3 bg-background/70">
                  <p className="text-sm text-muted-foreground">{key}</p>
                  <p className="font-semibold">Moyenne: {vitals?.[key]?.avg ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Dernière valeur: {vitals?.[key]?.last ?? 0}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
