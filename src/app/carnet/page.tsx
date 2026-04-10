'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, Plus, Quote, Sparkles } from 'lucide-react';
import { getCsrfToken } from '@/lib/security/csrf-client';
import { Badge, Button, Input, Select, StateNotice, Surface, Textarea } from '@/components/ui';

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
        throw new Error('L’enregistrement n’a pas abouti. Vérifie ta connexion et réessaie.');
      }
      setContenu('');
      setPage('');
      setTags('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'L’enregistrement a rencontré un problème.');
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
      <section className="hero-premium-panel relative overflow-hidden rounded-[var(--radius-2xl)] px-6 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.22),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="hero-kicker">
              <BookOpen className="h-4 w-4" />
              Carnet de lecture
            </div>
            <h1 className="font-display mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Un lieu pour garder les œuvres vivantes, pas seulement les résumer.
            </h1>
            <p className="hero-body mt-4 max-w-3xl text-sm leading-7 md:text-base">
              Note une citation, une réaction, un lien culturel ou un mini résumé. Le carnet sert à préparer l’entretien et à retrouver vite une matière personnelle quand il faut reparler d’une œuvre.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="hero-glass-card rounded-[var(--radius-2xl)] px-4 py-4">
              <p className="ui-stat-label text-[var(--hero-kicker-text)]">Entrées</p>
              <p className="mt-2 text-2xl font-semibold text-white">{entries.length}</p>
            </div>
            <div className="hero-glass-card rounded-[var(--radius-2xl)] px-4 py-4">
              <p className="ui-stat-label text-[var(--hero-kicker-text)]">Œuvres</p>
              <p className="mt-2 text-2xl font-semibold text-white">{grouped.length}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- download endpoint */}
            <a
              href="/api/v1/carnet/export"
              className="hero-glass-card rounded-[var(--radius-2xl)] px-4 py-4 text-white transition-colors hover:bg-[var(--hero-glass-bg-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-primary)]"
            >
              <p className="ui-stat-label text-[var(--hero-kicker-text)]">Export</p>
              <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold"><Download className="h-4 w-4" /> Exporter en PDF</p>
            </a>
          </div>
        </div>
      </section>

      {error && (
        <StateNotice title="Le carnet n’a pas pu être chargé" description={`${error} Rafraîchis la page ou réessaie dans quelques instants.`} variant="error" />
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Surface tone="default" padding="md">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="ui-kicker text-[var(--c-reward)]">Nouvelle entrée</p>
                <h2 className="font-display mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Noter pendant que c’est encore vivant
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Input
                label={'Œuvre'}
                id="carnet-oeuvre"
                value={oeuvre}
                onChange={(event) => setOeuvre(event.target.value)}
                placeholder="Ex : Sido, Manon Lescaut, Les Fleurs du mal..."
                size="md"
              />
              <Select
                id="carnet-type"
                label="Type de note"
                value={type}
                onChange={(event) => setType(event.target.value as CarnetEntry['type'])}
                options={TYPES.map((entryType) => ({ value: entryType, label: TYPE_LABELS[entryType] }))}
              />
              <Input
                label="Page"
                hint="Optionnel"
                id="carnet-page"
                value={page}
                onChange={(event) => setPage(event.target.value)}
                placeholder="Ex : 42"
                size="md"
              />
              <Input
                label="Mots-clés"
                hint="Séparés par virgules"
                id="carnet-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Ex : mémoire, enfance, nature"
                size="md"
              />
              <Textarea
                label="Contenu"
                id="carnet-contenu"
                value={contenu}
                onChange={(event) => setContenu(event.target.value)}
                placeholder="Note ta citation, réaction ou observation ici..."
                rows={5}
                size="md"
              />
              <Button
                onClick={() => void submit()}
                loading={saving}
                icon={<Plus className="h-4 w-4" />}
              >
                Ajouter
              </Button>
            </div>
          </Surface>

          <section className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-primary)]">Répartition des notes</p>
            <div className="mt-4 space-y-3">
              {typeStats.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-body)]">
                  <span>{item.label}</span>
                  <span className="font-semibold text-[var(--c-primary)]">{item.count}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          {loading ? (
            <StateNotice
              title="Préparation de ton carnet de lecture"
              description="Tes notes, citations et réactions sont en cours de chargement. Cela ne prend que quelques secondes."
              variant="loading"
              className="max-w-2xl"
            />
          ) : grouped.length === 0 ? (
            <StateNotice
              title="Ton carnet de lecture est prêt"
              description="Note une citation marquante, une réaction personnelle ou un lien culturel. Plus tes notes sont précises et sincères, plus elles te seront utiles le jour de l’entretien."
              variant="info"
              icon={Quote}
              center
              className="border-dashed bg-[var(--bg-surface-secondary)] px-6 py-12"
            />
          ) : (
            grouped.map(([oeuvreName, oeuvreEntries]) => (
              <section key={oeuvreName} className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] p-5 shadow-[var(--shadow-md)] md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-[var(--c-primary)]">{oeuvreName}</h2>
                  <span className="rounded-full bg-[var(--c-primary)]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--c-primary)]">
                    {oeuvreEntries.length} entrée{oeuvreEntries.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {oeuvreEntries.map((entry) => (
                    <article key={entry.id} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)]">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-body)]">
                        <Badge variant="navy" size="sm" className="bg-[var(--c-primary)]/8 text-[var(--c-primary)]">{TYPE_LABELS[entry.type]}</Badge>
                        <span>{new Date(entry.createdAt).toLocaleDateString('fr-FR')}</span>
                        {entry.page ? <span>p.{entry.page}</span> : null}
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-body)]">{entry.contenu}</p>
                      {entry.tags.length > 0 && <p className="mt-3 text-xs text-[var(--text-muted)]">#{entry.tags.join(' #')}</p>}
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
