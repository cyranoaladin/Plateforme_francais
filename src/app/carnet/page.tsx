'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, Plus, ScrollText, Sparkles } from '@/components/ui/icons';
import { getCsrfToken } from '@/lib/security/csrf-client';
import { Badge, Button, StateNotice } from '@/components/ui';

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

const TYPE_COLORS: Record<CarnetEntry['type'], { bg: string; text: string; border: string }> = {
  citation: {
    bg: 'rgba(123, 142, 255, 0.15)',
    text: 'var(--eaf-indigo)',
    border: 'rgba(123, 142, 255, 0.3)',
  },
  note: {
    bg: 'rgba(123, 142, 255, 0.08)',
    text: 'var(--eaf-fg2)',
    border: 'rgba(123, 142, 255, 0.15)',
  },
  reaction: {
    bg: 'rgba(255, 181, 71, 0.15)',
    text: 'var(--eaf-gold)',
    border: 'rgba(255, 181, 71, 0.3)',
  },
  resume: {
    bg: 'rgba(26, 213, 160, 0.15)',
    text: 'var(--eaf-teal)',
    border: 'rgba(26, 213, 160, 0.3)',
  },
  lien_culturel: {
    bg: 'rgba(255, 107, 53, 0.15)',
    text: 'var(--eaf-orange)',
    border: 'rgba(255, 107, 53, 0.3)',
  },
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
        throw new Error('Le chargement du carnet a rencontré un problème.');
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
      setError('Œuvre et contenu sont obligatoires.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch('/api/v1/carnet/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
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
        throw new Error('L\'enregistrement n\'a pas abouti. Vérifie ta connexion et réessaie.');
      }
      setContenu('');
      setPage('');
      setTags('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'L\'enregistrement a rencontré un problème.');
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
      {/* Hero - Gradient bleu-nuit */}
      <section
        className="relative overflow-hidden rounded-2xl px-6 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10"
        style={{
          background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)',
          border: '1px solid rgba(123, 142, 255, 0.15)',
        }}
      >
        {/* Glow effects */}
        <div
          className="absolute -right-[5%] top-1/2 hidden h-[60%] w-[30%] -translate-y-1/2 rounded-full blur-3xl lg:block"
          style={{ background: 'radial-gradient(circle at center, rgba(123, 142, 255, 0.12), transparent 70%)' }}
        />
        <div
          className="absolute -left-[3%] -top-[15%] h-36 w-36 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle at center, rgba(255, 181, 71, 0.12), transparent 60%)' }}
        />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{
                background: 'rgba(123, 142, 255, 0.12)',
                color: 'var(--eaf-indigo)',
              }}
            >
              <BookOpen className="h-4 w-4" />
              Carnet de lecture
            </div>
            <h1
              className="text-on-dark-h1 mt-5 max-w-4xl text-4xl leading-tight md:text-[44px]"
              style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1.5px' }}
            >
              Un lieu pour garder les œuvres vivantes, pas seulement les résumer.
            </h1>
            <p className="text-on-dark-body mt-4 max-w-3xl text-sm leading-7 md:text-base">
              Note une citation, une réaction, un lien culturel ou un mini résumé. Le carnet sert à préparer l'entretien et à retrouver vite une matière personnelle quand il faut reparler d'une œuvre.
            </p>
          </div>

          {/* Stats + Export */}
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div
              className="stat-card-dark rounded-xl px-4 py-4"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p className="stat-label text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--eaf-indigo)]">
                Entrées
              </p>
              <p className="stat-value mt-2 text-2xl font-semibold">{entries.length}</p>
            </div>
            <div
              className="stat-card-dark rounded-xl px-4 py-4"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p className="stat-label text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--eaf-gold)]">
                Œuvres
              </p>
              <p className="stat-value mt-2 text-2xl font-semibold">{grouped.length}</p>
            </div>
            {/* Export PDF - séparé des stats */}
            <div
              className="stat-card-dark rounded-xl px-4 py-4"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p className="stat-label text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--eaf-fg3)]">
                Export
              </p>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/api/v1/carnet/export"
                className="mt-2 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:border-[var(--eaf-indigo)]/30 hover:bg-[var(--eaf-indigo)]/5 hover:text-[var(--eaf-indigo)]"
                style={{
                  borderColor: 'rgba(123, 142, 255, 0.2)',
                  background: 'var(--eaf-bg1)',
                  color: 'var(--eaf-fg1)',
                }}
              >
                <Download className="h-4 w-4" />
                Exporter en PDF
              </a>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <StateNotice
          title="Le carnet n'a pas pu être chargé"
          description={`${error} Rafraîchis la page ou réessaie dans quelques instants.`}
          variant="error"
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Nouvelle entrée */}
          <section
            className="rounded-xl p-5"
            style={{
              background: 'var(--eaf-bg2)',
              border: '1px solid rgba(123, 142, 255, 0.12)',
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--eaf-indigo)/10', color: 'var(--eaf-indigo)' }}
              >
                <Sparkles className="h-5 w-5" style={{ color: 'var(--eaf-indigo)' }} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-indigo)]">
                  Nouvelle entrée
                </p>
                <h2
                  className="mt-2 text-3xl leading-tight text-[var(--eaf-fg0)]"
                  style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1px' }}
                >
                  Noter pendant que c'est encore vivant
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {/* Œuvre */}
              <div>
                <label
                  htmlFor="carnet-oeuvre"
                  className="mb-1.5 block text-sm font-medium text-[var(--eaf-fg2)]"
                >
                  Œuvre
                </label>
                <input
                  id="carnet-oeuvre"
                  type="text"
                  value={oeuvre}
                  onChange={(event) => setOeuvre(event.target.value)}
                  placeholder="Ex : Sido, Manon Lescaut, Les Fleurs du mal..."
                  className="w-full rounded-lg border px-3 py-3 text-sm outline-none transition-all focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20"
                  style={{
                    borderColor: 'rgba(123, 142, 255, 0.2)',
                    background: 'var(--eaf-bg1)',
                    color: 'var(--eaf-fg0)',
                  }}
                />
              </div>

              {/* Type de note */}
              <div>
                <label
                  htmlFor="carnet-type"
                  className="mb-1.5 block text-sm font-medium text-[var(--eaf-fg2)]"
                >
                  Type de note
                </label>
                <select
                  id="carnet-type"
                  value={type}
                  onChange={(event) => setType(event.target.value as CarnetEntry['type'])}
                  className="w-full appearance-none rounded-lg border px-3 py-3 text-sm outline-none transition-all focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20"
                  style={{
                    borderColor: 'rgba(123, 142, 255, 0.2)',
                    background: 'var(--eaf-bg1)',
                    color: 'var(--eaf-fg0)',
                  }}
                >
                  {TYPES.map((entryType) => (
                    <option key={entryType} value={entryType}>
                      {TYPE_LABELS[entryType]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page */}
              <div>
                <label
                  htmlFor="carnet-page"
                  className="mb-1.5 flex items-center justify-between text-sm font-medium text-[var(--eaf-fg2)]"
                >
                  <span>Page</span>
                  <span className="text-xs italic text-[var(--eaf-fg3)]">Optionnel</span>
                </label>
                <input
                  id="carnet-page"
                  type="text"
                  value={page}
                  onChange={(event) => setPage(event.target.value)}
                  placeholder="Ex : 42"
                  className="w-full rounded-lg border px-3 py-3 text-sm outline-none transition-all focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20"
                  style={{
                    borderColor: 'rgba(123, 142, 255, 0.2)',
                    background: 'var(--eaf-bg1)',
                    color: 'var(--eaf-fg0)',
                  }}
                />
              </div>

              {/* Mots-clés */}
              <div>
                <label
                  htmlFor="carnet-tags"
                  className="mb-1.5 block text-sm font-medium text-[var(--eaf-fg2)]"
                >
                  Mots-clés
                </label>
                <input
                  id="carnet-tags"
                  type="text"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="Ex : mémoire, enfance, nature"
                  className="w-full rounded-lg border px-3 py-3 text-sm outline-none transition-all focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20"
                  style={{
                    borderColor: 'rgba(123, 142, 255, 0.2)',
                    background: 'var(--eaf-bg1)',
                    color: 'var(--eaf-fg0)',
                  }}
                />
                <p className="mt-1 text-xs text-[var(--eaf-fg3)]">Séparés par virgules</p>
              </div>

              {/* Contenu */}
              <div>
                <label
                  htmlFor="carnet-contenu"
                  className="mb-1.5 block text-sm font-medium text-[var(--eaf-fg2)]"
                >
                  Contenu
                </label>
                <textarea
                  id="carnet-contenu"
                  value={contenu}
                  onChange={(event) => setContenu(event.target.value)}
                  placeholder="Note ta citation, réaction ou observation ici..."
                  rows={5}
                  className="w-full resize-y rounded-lg border px-3 py-3 text-sm leading-6 outline-none transition-all focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20"
                  style={{
                    borderColor: 'rgba(123, 142, 255, 0.2)',
                    background: 'var(--eaf-bg1)',
                    color: 'var(--eaf-fg0)',
                  }}
                />
              </div>

              {/* Bouton Ajouter */}
              <Button
                onClick={() => void submit()}
                loading={saving}
                icon={<Plus className="h-4 w-4" />}
                size="md"
                className="rounded-xl font-semibold"
                style={{
                  background: 'var(--eaf-orange)',
                  color: '#050913',
                }}
              >
                Ajouter
              </Button>
            </div>
          </section>

          {/* Répartition des notes */}
          <section
            className="rounded-xl p-5"
            style={{
              background: 'var(--eaf-bg2)',
              border: '1px solid rgba(123, 142, 255, 0.12)',
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-fg3)]">
              Répartition des notes
            </p>
            <div className="mt-4 space-y-2">
              {typeStats.map((item) => {
                const colors = TYPE_COLORS[item.key];
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                    style={{
                      background: 'var(--eaf-bg1)',
                      borderColor: 'rgba(123, 142, 255, 0.1)',
                      borderLeft: `3px solid ${colors.border}`,
                    }}
                  >
                    <span style={{ color: colors.text }}>{item.label}</span>
                    <span className="font-semibold text-[var(--eaf-fg0)]">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        {/* Zone entrées */}
        <section className="space-y-4">
          {loading ? (
            <StateNotice
              title="Préparation de ton carnet de lecture"
              description="Tes notes, citations et réactions sont en cours de chargement. Cela ne prend que quelques secondes."
              variant="loading"
              className="max-w-2xl"
            />
          ) : grouped.length === 0 ? (
            <div
              className="flex min-h-[500px] flex-col items-center justify-center rounded-xl border p-12"
              style={{
                background: 'var(--eaf-bg1)',
                borderColor: 'rgba(123, 142, 255, 0.12)',
              }}
            >
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
                style={{ background: 'var(--eaf-bg2)', border: '1px solid rgba(123, 142, 255, 0.1)' }}
              >
                <ScrollText className="h-6 w-6" style={{ color: 'var(--eaf-fg3)' }} />
              </div>
              <h3
                className="text-center text-xl font-semibold text-[var(--eaf-fg0)]"
                style={{ fontFamily: 'var(--font-heading, Fraunces, serif)' }}
              >
                Ton carnet de lecture est prêt
              </h3>
              <p className="mt-2 max-w-[380px] text-center text-sm leading-6 text-[var(--eaf-fg2)]">
                Note une citation marquante, une réaction personnelle ou un lien culturel. Plus tes notes sont précises et sincères, plus elles te seront utiles le jour de l'entretien.
              </p>
              <button
                onClick={() => document.getElementById('carnet-oeuvre')?.focus()}
                className="mt-5 rounded-lg border px-4 py-2 text-sm font-medium transition-all hover:border-[var(--eaf-indigo)]/30 hover:bg-[var(--eaf-indigo)]/5 hover:text-[var(--eaf-indigo)]"
                style={{
                  borderColor: 'rgba(123, 142, 255, 0.2)',
                  background: 'var(--eaf-bg2)',
                  color: 'var(--eaf-indigo)',
                }}
              >
                Ajouter ma première note →
              </button>
            </div>
          ) : (
            grouped.map(([oeuvreName, oeuvreEntries]) => (
              <section
                key={oeuvreName}
                className="rounded-xl border p-5"
                style={{
                  background: 'var(--eaf-bg1)',
                  borderColor: 'rgba(123, 142, 255, 0.12)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2
                    className="text-xl font-semibold text-[var(--eaf-fg0)]"
                    style={{ fontFamily: 'var(--font-heading, Fraunces, serif)' }}
                  >
                    {oeuvreName}
                  </h2>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
                    style={{
                      background: 'var(--eaf-indigo)/10',
                      color: 'var(--eaf-indigo)',
                    }}
                  >
                    {oeuvreEntries.length} entrée{oeuvreEntries.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {oeuvreEntries.map((entry) => {
                    const typeColors = TYPE_COLORS[entry.type];
                    return (
                      <article
                        key={entry.id}
                        className="rounded-xl border p-4"
                        style={{
                          background: 'var(--eaf-bg2)',
                          borderColor: 'rgba(123, 142, 255, 0.1)',
                          borderLeft: `3px solid ${typeColors.border}`,
                        }}
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge
                            size="sm"
                            className="border-0"
                            style={{
                              background: typeColors.bg,
                              color: typeColors.text,
                            }}
                          >
                            {TYPE_LABELS[entry.type]}
                          </Badge>
                          <span className="text-[var(--eaf-fg3)]">
                            {new Date(entry.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                          {entry.page ? (
                            <span className="text-[var(--eaf-fg3)]">p.{entry.page}</span>
                          ) : null}
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--eaf-fg1)]">
                          {entry.contenu}
                        </p>
                        {entry.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full px-2 py-0.5 text-[11px]"
                                style={{
                                  background: 'var(--eaf-bg3)',
                                  color: 'var(--eaf-fg3)',
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
