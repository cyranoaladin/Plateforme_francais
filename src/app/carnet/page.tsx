'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, Loader2, Plus, Quote, Sparkles } from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';
import { StateNotice } from '@/components/ui/state-notice';

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

const TYPE_LABELS: Record<CarnetEntry['type'], string> = {
  citation: 'Citation',
  note: 'Note',
  reaction: 'Réaction',
  resume: 'Résumé',
  lien_culturel: 'Lien culturel',
};

const EDITORIAL_HEADING = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur de chargement.');
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
            .map((tag) => tag.trim())
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur enregistrement.');
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

  const typeStats = useMemo(() => {
    return TYPES.map((entryType) => ({
      key: entryType,
      label: TYPE_LABELS[entryType],
      count: entries.filter((entry) => entry.type === entryType).length,
    }));
  }, [entries]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#17324d] px-6 py-7 text-[#f7f2ea] shadow-[0_32px_90px_rgba(23,50,77,0.22)] md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.22),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
              <BookOpen className="h-4 w-4" />
              Carnet de lecture
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Un lieu pour garder les œuvres vivantes, pas seulement les résumer.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#dfe8f0] md:text-base">
              Note une citation, une réaction, un lien culturel ou un mini résumé. Le carnet sert à préparer l entretien et à retrouver vite une matière personnelle quand il faut reparler d une œuvre.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">Entrées</p>
              <p className="mt-2 text-2xl font-semibold text-white">{entries.length}</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">Œuvres</p>
              <p className="mt-2 text-2xl font-semibold text-white">{grouped.length}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- download endpoint */}
            <a href="/api/v1/carnet/export" className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 text-white backdrop-blur-sm transition hover:bg-white/14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">Export</p>
              <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold"><Download className="h-4 w-4" /> Export PDF</p>
            </a>
          </div>
        </div>
      </section>

      {error && (
        <StateNotice title="Carnet indisponible pour l instant" description={error} variant="error" />
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-5 shadow-[0_20px_70px_rgba(23,50,77,0.08)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17324d]/8 text-[#17324d]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Nouvelle entrée</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[#17324d]">
                  Noter pendant que c est encore vivant
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <input
                value={oeuvre}
                onChange={(event) => setOeuvre(event.target.value)}
                placeholder="Oeuvre"
                className="w-full rounded-[18px] border border-[#dfd1bc] bg-white px-3 py-3 text-sm text-[#17324d] outline-none transition placeholder:text-[#8b95a1] focus:border-[#17324d]/18 focus:ring-2 focus:ring-[#17324d]/8"
              />
              <select
                value={type}
                onChange={(event) => setType(event.target.value as CarnetEntry['type'])}
                className="w-full rounded-[18px] border border-[#dfd1bc] bg-white px-3 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#17324d]/18 focus:ring-2 focus:ring-[#17324d]/8"
              >
                {TYPES.map((entryType) => (
                  <option key={entryType} value={entryType}>{TYPE_LABELS[entryType]}</option>
                ))}
              </select>
              <input
                value={page}
                onChange={(event) => setPage(event.target.value)}
                placeholder="Page (optionnel)"
                className="w-full rounded-[18px] border border-[#dfd1bc] bg-white px-3 py-3 text-sm text-[#17324d] outline-none transition placeholder:text-[#8b95a1] focus:border-[#17324d]/18 focus:ring-2 focus:ring-[#17324d]/8"
              />
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Tags separes par virgules"
                className="w-full rounded-[18px] border border-[#dfd1bc] bg-white px-3 py-3 text-sm text-[#17324d] outline-none transition placeholder:text-[#8b95a1] focus:border-[#17324d]/18 focus:ring-2 focus:ring-[#17324d]/8"
              />
              <textarea
                value={contenu}
                onChange={(event) => setContenu(event.target.value)}
                placeholder="Contenu"
                className="min-h-36 w-full rounded-[18px] border border-[#dfd1bc] bg-white px-3 py-3 text-sm leading-7 text-[#17324d] outline-none transition placeholder:text-[#8b95a1] focus:border-[#17324d]/18 focus:ring-2 focus:ring-[#17324d]/8"
              />
              <button
                onClick={() => void submit()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-[20px] bg-[#17324d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#244a6d] disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Ajouter
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#d8e8e3] bg-[#edf7f3] p-5 shadow-[0_18px_55px_rgba(15,118,110,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f766e]">Répartition des notes</p>
            <div className="mt-4 space-y-3">
              {typeStats.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-[18px] border border-[#d3e7e1] bg-white/88 px-4 py-3 text-sm text-[#33536f]">
                  <span>{item.label}</span>
                  <span className="font-semibold text-[#17324d]">{item.count}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          {loading ? (
            <StateNotice
              title="Chargement du carnet"
              description="Les entrees, les regroupements par oeuvre et les statistiques de notes sont en cours de preparation."
              variant="loading"
              className="max-w-2xl"
            />
          ) : grouped.length === 0 ? (
            <StateNotice
              title="Aucune entrée pour le moment."
              description="Commence par une citation, une reaction ou un lien culturel. Le carnet prend de la valeur quand il reste personnel et precis."
              variant="info"
              icon={Quote}
              center
              className="border-dashed bg-[#fffaf2] px-6 py-12"
            />
          ) : (
            grouped.map(([oeuvreName, oeuvreEntries]) => (
              <section key={oeuvreName} className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-5 shadow-[0_16px_40px_rgba(23,50,77,0.06)] md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-[#17324d]">{oeuvreName}</h2>
                  <span className="rounded-full bg-[#17324d]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#17324d]">
                    {oeuvreEntries.length} entrée{oeuvreEntries.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {oeuvreEntries.map((entry) => (
                    <article key={entry.id} className="rounded-[22px] border border-[#eadbc5] bg-white p-4 shadow-[0_10px_24px_rgba(23,50,77,0.05)]">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#7a6858]">
                        <span className="rounded-full bg-[#17324d]/8 px-2.5 py-1 font-semibold text-[#17324d]">{TYPE_LABELS[entry.type]}</span>
                        <span>{new Date(entry.createdAt).toLocaleDateString('fr-FR')}</span>
                        {entry.page ? <span>p.{entry.page}</span> : null}
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#33536f]">{entry.contenu}</p>
                      {entry.tags.length > 0 && <p className="mt-3 text-xs text-[#6d7e8d]">#{entry.tags.join(' #')}</p>}
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
