'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, Plus, Loader2 } from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type CarnetEntry = {
  id: string;
  oeuvre: string;
  type: 'citation' | 'note' | 'reaction' | 'resume' | 'lien_culturel';
  contenu: string;
  page?: string;
  tags: string[];
  createdAt: string;
};

const TYPES: CarnetEntry['type'][] = ['citation', 'note', 'reaction', 'resume', 'lien_culturel'];

export default function CarnetPage() {
  const [entries, setEntries] = useState<CarnetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [oeuvre, setOeuvre] = useState('');
  const [type, setType] = useState<CarnetEntry['type']>('note');
  const [contenu, setContenu] = useState('');
  const [page, setPage] = useState('');
  const [tags, setTags] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/carnet/entry');
      if (!response.ok) {
        throw new Error('Chargement du carnet impossible.');
      }
      const payload = (await response.json()) as { entries: CarnetEntry[] };
      setEntries(payload.entries ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    if (!oeuvre.trim() || !contenu.trim()) {
      setError('Oeuvre et contenu sont obligatoires.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/carnet/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({
          oeuvre: oeuvre.trim(),
          type,
          contenu: contenu.trim(),
          page: page.trim() || undefined,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (!response.ok) {
        throw new Error('Enregistrement impossible.');
      }
      setContenu('');
      setPage('');
      setTags('');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, CarnetEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.oeuvre) ?? [];
      list.push(entry);
      map.set(entry.oeuvre, list);
    }
    return Array.from(map.entries());
  }, [entries]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><BookOpen className="w-7 h-7 text-primary" /> Carnet de lecture</h1>
          <p className="text-muted-foreground">Notes personnelles pour l entretien oral: citations, reactions, resumes, liens culturels.</p>
        </div>
        <a href="/api/v1/carnet/export" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-medium">
          <Download className="w-4 h-4" /> Export PDF
        </a>
      </div>

      {error && <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-error text-sm">{error}</div>}

      <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-bold">Nouvelle entree</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={oeuvre} onChange={(e) => setOeuvre(e.target.value)} placeholder="Oeuvre" className="px-3 py-2 rounded-xl border border-border bg-background" />
          <select value={type} onChange={(e) => setType(e.target.value as CarnetEntry['type'])} className="px-3 py-2 rounded-xl border border-border bg-background">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={page} onChange={(e) => setPage(e.target.value)} placeholder="Page (optionnel)" className="px-3 py-2 rounded-xl border border-border bg-background" />
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags separes par virgules" className="px-3 py-2 rounded-xl border border-border bg-background" />
        </div>
        <textarea value={contenu} onChange={(e) => setContenu(e.target.value)} placeholder="Contenu" className="w-full min-h-28 px-3 py-2 rounded-xl border border-border bg-background" />
        <button onClick={() => void submit()} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Ajouter
        </button>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="p-6 rounded-xl border border-border bg-card flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
          </div>
        ) : grouped.length === 0 ? (
          <div className="p-6 rounded-xl border border-border bg-card text-sm text-muted-foreground">Aucune entree pour le moment.</div>
        ) : (
          grouped.map(([oeuvreName, oeuvreEntries]) => (
            <div key={oeuvreName} className="rounded-2xl border border-border bg-card p-4">
              <h3 className="font-semibold mb-3">{oeuvreName} ({oeuvreEntries.length})</h3>
              <div className="space-y-2">
                {oeuvreEntries.map((entry) => (
                  <div key={entry.id} className="p-3 rounded-xl border border-border bg-muted/20">
                    <div className="text-xs text-muted-foreground mb-1">{entry.type} · {new Date(entry.createdAt).toLocaleDateString('fr-FR')}{entry.page ? ` · p.${entry.page}` : ''}</div>
                    <p className="text-sm whitespace-pre-wrap">{entry.contenu}</p>
                    {entry.tags.length > 0 && <p className="text-xs mt-1 text-muted-foreground">#{entry.tags.join(' #')}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
