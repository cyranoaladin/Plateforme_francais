'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Filter,
  FolderOpen,
  GraduationCap,
  Lock,
  Play,
  Search,
  Video,
  X,
} from 'lucide-react';
import {
  RESSOURCES,
  type EafResource,
  type ResourceCategory,
  formatFileSize,
  formatResourceTitle,
  getCategoryLabel,
  getResourceIcon,
  getRessourcesByCategory,
} from '@/data/ressources';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';
import { getCsrfToken } from '@/lib/security/csrf-client';
import { PdfPreviewViewer } from '@/components/ui/pdf-preview-viewer';
import { FREE_LIBRARY_LIMITS, FREE_TOTAL_LIMIT, LIBRARY_TOTAL_RESOURCES } from '@/lib/billing/library-gating';
import { Badge, Button, StateNotice, Surface } from '@/components/ui';
import { useDialogAccessibility } from '@/components/ui/use-dialog-accessibility';

const CATEGORY_ICONS: Record<ResourceCategory, typeof FolderOpen> = {
  Annales_EAF: GraduationCap,
  Oeuvres: BookOpen,
  Videos: Video,
  Documents_Extraits: FileText,
  eaf_rapport_jury: BarChart3,
};

const CATEGORY_ORDER: ResourceCategory[] = [
  'Annales_EAF',
  'Oeuvres',
  'Videos',
  'Documents_Extraits',
  'eaf_rapport_jury',
];

type RagResult = {
  id: string;
  title: string;
  type: string;
  level: string;
  sourceRef: string;
  excerpt: string;
  score: number;
};

const VIDEO_MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
};

function buildResourceDescription(resource: EafResource) {
  if (resource.description) return resource.description;
  if (resource.category === 'Annales_EAF') {
    return 'Sujet blanc, annale ou document de cadrage pour travailler dans un format d\u2019épreuve crédible.';
  }
  if (resource.category === 'Oeuvres') {
    return 'Texte d\u2019œuvre au programme pour relire, annoter et réactiver les repères utiles à l\u2019oral comme à l\u2019écrit.';
  }
  if (resource.category === 'Videos') {
    return 'Capsule vidéo à consulter quand il faut relancer un point de méthode sans repartir de zéro.';
  }
  if (resource.category === 'eaf_rapport_jury') {
    return 'Lecture stratégique pour comprendre ce que les correcteurs et jurys attendent réellement.';
  }
  return 'Document interne à la plateforme pour cadrer méthode, attentes et repères utiles.';
}

function getProtectedResourceUrl(resource: EafResource, options?: { download?: boolean }): string {
  const relativePath = resource.url.replace(/^\/ressources\//, '');
  const params = new URLSearchParams({ path: relativePath });
  if (options?.download) {
    params.set('download', '1');
  }
  return `/api/v1/ressources/file?${params.toString()}`;
}

function getVideoMimeType(resource: EafResource): string | undefined {
  if (!resource.ext) return undefined;
  return VIDEO_MIME_TYPES[resource.ext.toLowerCase()];
}

/** Pré-calcul des index par catégorie (stable, déterministe). */
const CATEGORY_INDEXES: Map<string, number> = new Map();
for (const cat of ['Annales_EAF', 'Oeuvres', 'Videos', 'Documents_Extraits', 'eaf_rapport_jury'] as const) {
  const catResources = getRessourcesByCategory(cat);
  catResources.forEach((r, idx) => CATEGORY_INDEXES.set(r.id, idx));
}

export default function BibliothequePage() {
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy] = useState<'name' | 'size'>('name');
  const [ragResults, setRagResults] = useState<RagResult[]>([]);
  const [selectedResource, setSelectedResource] = useState<EafResource | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const [hasFullAccess, setHasFullAccess] = useState(false); // false par défaut → freemium affiché, corrigé après fetch
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  const closeSelectedResource = useCallback(() => {
    setSelectedResource(null);
  }, []);

  useDialogAccessibility({
    open: selectedResource !== null,
    dialogRef,
    initialFocusRef: dialogCloseRef,
    onClose: closeSelectedResource,
  });

  useEffect(() => {
    fetch('/api/v1/billing/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { subscription?: { planId?: string } } | null) => {
        if (data?.subscription?.planId) {
          const planId = data.subscription.planId;
          setHasFullAccess(planId !== 'FREEMIUM');
        }
      })
      .catch(() => {
        // Non authentifié ou erreur → on considère FREE (verrouillé)
        setHasFullAccess(false);
      });
  }, []);

  /** Vérifie si une ressource est verrouillée pour le plan actuel. */
  const isResourceLocked = (resource: EafResource): boolean => {
    if (hasFullAccess) return false;
    const idx = CATEGORY_INDEXES.get(resource.id) ?? 0;
    const limit = FREE_LIBRARY_LIMITS[resource.category] ?? 2;
    return idx >= limit;
  };

  const filteredResources = useMemo(() => {
    let resources = RESSOURCES;

    if (activeCategory !== 'all') {
      resources = resources.filter((resource) => resource.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      resources = resources.filter(
        (resource) =>
          resource.title.toLowerCase().includes(query) ||
          resource.category.toLowerCase().includes(query) ||
          resource.type.toLowerCase().includes(query) ||
          resource.description?.toLowerCase().includes(query),
      );
    }

    resources.sort((a, b) => {
      if (sortBy === 'size') return (b.size ?? 0) - (a.size ?? 0);
      return a.title.localeCompare(b.title, 'fr');
    });

    return resources;
  }, [activeCategory, searchQuery, sortBy]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, EafResource[]> = {};

    for (const resource of filteredResources) {
      if (!groups[resource.category]) {
        groups[resource.category] = [];
      }
      groups[resource.category].push(resource);
    }

    return groups;
  }, [filteredResources]);

  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const resource of RESSOURCES) {
      byCategory[resource.category] = (byCategory[resource.category] || 0) + 1;
    }
    return {
      total: RESSOURCES.length,
      byCategory,
    };
  }, []);

  const highlightedCategories = CATEGORY_ORDER.map((category) => ({
    category,
    label: getCategoryLabel(category),
    count: stats.byCategory[category] || 0,
    icon: CATEGORY_ICONS[category],
  }));

  const selectedResourceOpenHref = selectedResource ? getProtectedResourceUrl(selectedResource) : null;
  const selectedResourceDownloadHref = selectedResource ? getProtectedResourceUrl(selectedResource, { download: true }) : null;
  const selectedResourceTutorHref = useMemo(() => {
    if (!selectedResource) {
      return '/tuteur';
    }

    return buildTuteurHref({
      workId:
        selectedResource.type === 'oeuvre'
          ? formatResourceTitle(selectedResource.title, selectedResource.ext)
          : null,
      parcours: selectedResource.subject ?? null,
    });
  }, [selectedResource]);

  const runRagSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setRagError(null);

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch('/api/v1/rag/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ query: searchQuery, maxResults: 8 }),
      });

      if (!response.ok) {
        throw new Error('Recherche intelligente indisponible pour le moment.');
      }

      const payload = (await response.json()) as { results: RagResult[] };
      setRagResults(payload.results);
    } catch (cause) {
      setRagResults([]);
      setRagError(cause instanceof Error ? cause.message : 'Recherche indisponible.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') void runRagSearch();
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="hero-premium-panel relative overflow-hidden rounded-[24px] px-6 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.22),_transparent_70%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">
              <BookOpen className="h-4 w-4" />
              Bibliothèque pédagogique
            </div>
            <h1 className="font-display mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Un fonds de travail EAF qui aide à avancer, pas un simple stock de fichiers.
            </h1>
            <p className="hero-body mt-4 max-w-3xl text-sm leading-7 md:text-base">
              Annales, œuvres, rapports de jury, documents et vidéos sont réunis dans un espace conçu pour réactiver
              vite une méthode, une œuvre ou un repère utile juste avant un atelier, un oral ou une révision ciblée.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              { label: 'Ressources actives', value: String(stats.total).padStart(2, '0') },
              { label: 'Catégories pilotées', value: String(CATEGORY_ORDER.length).padStart(2, '0') },
              { label: 'Usage conseillé', value: 'Court + ciblé' },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-amber-300)]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!hasFullAccess && (
        <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-reward)] px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--c-reward)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--c-primary)]">
                  Tu accèdes à {FREE_TOTAL_LIMIT} ressources sur {LIBRARY_TOTAL_RESOURCES} avec le plan Freemium.
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  Les ressources verrouillées restent visibles. Passe à Premium pour toutes les débloquer.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--c-primary)] px-5 py-2.5 text-sm font-bold text-[var(--text-on-primary)] transition hover:bg-[var(--c-primary-active)]"
            >
              Passer au plan supérieur
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] p-5 shadow-[var(--shadow-md)] md:p-6">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Recherche assistée</p>
            <h2 className="font-display mt-3 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
              Cherche par besoin réel : œuvre, auteur, méthode, rapport ou question précise.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              La recherche standard filtre le catalogue. La recherche intelligente tente en plus de remonter les passages les
              plus pertinents pour ta requête.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {highlightedCategories.slice(0, 3).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.category} className="rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-surface)]/80 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--c-primary)]">{item.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{item.count} ressources</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-icon)]" />
            <label htmlFor="rag-query" className="sr-only">Recherche</label>
            <input
              id="rag-query"
              data-testid="rag-query"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Exemple : explication linéaire, problématique dissertation, Rimbaud, rapport jury..."
              className="w-full rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-11 py-4 text-sm text-[var(--c-primary)] outline-none transition-all duration-[var(--transition-normal)] placeholder:text-[var(--text-placeholder)] focus:border-[var(--c-success)] focus:ring-2 focus:ring-[var(--c-success)]/20"
            />
          </div>
          <Button
            data-testid="rag-submit"
            onClick={() => void runRagSearch()}
            loading={isSearching}
            icon={!isSearching ? <Search className="h-4 w-4" /> : undefined}
            size="lg"
            className="rounded-[22px]"
          >
            {isSearching ? 'Recherche…' : 'Recherche intelligente'}
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-body)]">
            <Filter className="h-4 w-4" />
            Filtrer
          </span>
          <button
            onClick={() => setActiveCategory('all')}
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition-all duration-[var(--transition-normal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c-success)] ${activeCategory === 'all' ? 'bg-[var(--c-primary)] text-[var(--text-on-primary)]' : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--c-primary)] hover:border-[var(--c-primary)]/18'}`}
          >
            Toutes les ressources
          </button>
          {CATEGORY_ORDER.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            const count = RESSOURCES.filter((resource) => resource.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-[var(--transition-normal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c-success)] ${activeCategory === category ? 'bg-[var(--c-success)] text-[var(--text-on-primary)]' : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--c-primary)] hover:border-[var(--c-primary)]/18'}`}
              >
                <Icon className="h-4 w-4" />
                {getCategoryLabel(category)}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {ragError && (
        <StateNotice
          title="La recherche intelligente est momentanément indisponible"
          description={`${ragError} Tu peux toujours parcourir le catalogue et filtrer par catégorie en attendant.`}
          variant="warning"
          icon={Search}
        />
      )}

      {ragResults.length > 0 && (
        <section data-testid="rag-results" className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-5 shadow-[var(--shadow-md)] md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-success)]">Résultats de recherche</p>
              <h2 className="font-display mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                Passages remontés pour “{searchQuery}”.
              </h2>
            </div>
            <p className="text-sm text-[var(--text-success-on-subtle)]">{ragResults.length} résultats priorisés</p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {ragResults.map((item) => (
              <article key={`${item.id}-${item.sourceRef}`} className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-surface)]/90 p-4 shadow-[var(--shadow-md)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-success)]/10 text-[var(--c-success)]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold leading-6 text-[var(--c-primary)]">{item.title}</p>
                      <Badge variant="success" size="sm" className="uppercase tracking-[0.14em]">
                        score {item.score.toFixed(2)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{item.sourceRef} · {item.type} · {item.level}</p>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{item.excerpt}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-8">
        {CATEGORY_ORDER.map((category) => {
          const resources = groupedByCategory[category] || [];
          if (resources.length === 0) return null;

          const Icon = CATEGORY_ICONS[category];

          return (
            <section key={category} className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Catalogue vivant</p>
                  <h2 className="mt-2 flex items-center gap-3 text-2xl font-semibold text-[var(--c-primary)]">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    {getCategoryLabel(category)}
                  </h2>
                </div>
                <p className="text-sm text-[var(--text-muted)]">{resources.length} ressources visibles</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {resources.map((resource) => {
                  const locked = isResourceLocked(resource);
                  return (
                    <article
                      key={resource.id}
                      className={`group cursor-pointer rounded-[24px] border p-5 transition ${locked ? 'border-[var(--border-default)] bg-[var(--bg-surface-secondary)] opacity-75' : 'border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] shadow-[var(--shadow-md)] hover:-translate-y-1 hover:border-[var(--c-primary)]/16 hover:shadow-[var(--shadow-md)]'}`}
                      onClick={() => setSelectedResource(resource)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] text-3xl shadow-[inset_0_0_0_1px_rgba(23,50,77,0.06)] transition ${locked ? 'bg-[var(--border-disabled)] grayscale' : 'bg-[var(--bg-surface)] group-hover:bg-[var(--c-primary)]/6'}`}>
                          {locked ? <Lock className="h-6 w-6 text-[var(--text-disabled)]" /> : getResourceIcon(resource.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${locked ? 'bg-[var(--text-disabled)]/12 text-[var(--text-disabled)]' : 'bg-[var(--c-primary)]/8 text-[var(--c-primary)]'}`}>
                              {resource.type.replace('_', ' ')}
                            </span>
                            {resource.year && (
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${locked ? 'bg-[var(--text-disabled)]/8 text-[var(--text-disabled)]' : 'bg-[var(--color-amber-300)]/10 text-[var(--c-reward)]'}`}>
                                {resource.year}
                              </span>
                            )}
                            {resource.ext && (
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${locked ? 'bg-[var(--text-disabled)]/8 text-[var(--text-disabled)]' : 'bg-[var(--c-success)]/8 text-[var(--c-success)]'}`}>
                                {resource.ext.replace('.', '')}
                              </span>
                            )}
                            {locked && (
                              <Badge variant="navy" size="sm" className="uppercase tracking-[0.12em]">
                                Disponible avec Premium
                              </Badge>
                            )}
                          </div>
                          <p className={`mt-3 line-clamp-2 text-base font-semibold leading-7 transition ${locked ? 'text-[var(--text-muted)]' : 'text-[var(--c-primary)] group-hover:text-[var(--c-primary-muted)]'}`}>
                            {formatResourceTitle(resource.title, resource.ext)}
                          </p>
                          <p className={`mt-2 line-clamp-3 text-sm leading-6 ${locked ? 'text-[var(--text-disabled)]' : 'text-[var(--text-secondary)]'}`}>
                            {buildResourceDescription(resource)}
                          </p>
                          <div className={`mt-4 flex items-center justify-between text-xs ${locked ? 'text-[var(--text-disabled)]' : 'text-[var(--text-body)]'}`}>
                            <span>{formatFileSize(resource.size) || 'Taille non précisée'}</span>
                            {locked ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-disabled)]">
                                <Lock className="h-3 w-3" />
                                Verrouillée
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-[var(--c-primary)]">
                                Ouvrir la fiche
                                <ExternalLink className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <StateNotice
          title="Aucune ressource ne correspond à ces critères"
          description="Essaie d’élargir ta recherche ou de revenir sur « Toutes les ressources » pour retrouver l’ensemble du catalogue."
          variant="empty"
          icon={FolderOpen}
          center
          className="px-6 py-12"
          action={
            <Button
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              variant="secondary"
              size="md"
            >
              Voir toutes les ressources
            </Button>
          }
        />
      )}

      {selectedResource && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-0 backdrop-blur-sm md:p-8"
          onClick={closeSelectedResource}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-resource-title"
            aria-describedby="library-resource-description"
            tabIndex={-1}
            className="h-screen w-full overflow-auto rounded-none border-0 bg-[var(--bg-surface)] p-6 shadow-2xl md:h-auto md:max-h-[88vh] md:max-w-3xl md:rounded-[24px] md:border md:border-[var(--border-default)] md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-[var(--bg-surface)] text-4xl shadow-[inset_0_0_0_1px_rgba(23,50,77,0.08)]">
                  {getResourceIcon(selectedResource.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Fiche ressource</p>
                  <h3 id="library-resource-title" className="font-display mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                    {formatResourceTitle(selectedResource.title, selectedResource.ext)}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {getCategoryLabel(selectedResource.category)} · {formatFileSize(selectedResource.size) || 'Taille non précisée'}
                  </p>
                </div>
              </div>
              <Button
                ref={dialogCloseRef}
                onClick={closeSelectedResource}
                variant="secondary"
                size="sm"
                className="h-11 w-11 rounded-2xl border-[var(--border-default)] p-0"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <Surface tone="default" padding="md">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Pourquoi l’ouvrir</p>
                <p id="library-resource-description" className="mt-3 text-sm leading-7 text-[var(--text-body)]">{buildResourceDescription(selectedResource)}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge variant="default" size="sm">
                    Type: {selectedResource.type.replace('_', ' ')}
                  </Badge>
                  <Badge variant="success" size="sm">
                    Format : {selectedResource.ext?.toUpperCase() || 'Inconnu'}
                  </Badge>
                  {selectedResource.year && (
                    <Badge variant="premium" size="sm">
                      Année: {selectedResource.year}
                    </Badge>
                  )}
                  {selectedResource.subject && (
                    <Badge variant="default" size="sm" className="bg-[var(--c-primary)]/10 text-[var(--c-primary)] border-[var(--c-primary)]/20">
                      {selectedResource.subject}
                    </Badge>
                  )}
                </div>
              </Surface>

              <Surface tone="success" padding="md">
                {selectedResource && isResourceLocked(selectedResource) ? (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Ressource verrouillée</p>
                    <div className="mt-4 rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 text-center">
                      <Lock className="mx-auto h-8 w-8 text-[var(--text-disabled)]" />
                      <p className="mt-3 text-sm font-semibold text-[var(--c-primary)]">
                        Cette ressource fait partie des {LIBRARY_TOTAL_RESOURCES - FREE_TOTAL_LIMIT} contenus réservés aux abonnés.
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        Passe à Premium pour débloquer les {LIBRARY_TOTAL_RESOURCES} ressources de la bibliothèque complète.
                      </p>
                      <Link
                        href="/pricing"
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--c-primary)] px-6 py-3 text-sm font-bold text-[var(--text-on-primary)] transition hover:bg-[var(--c-primary-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-success)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
                      >
                        Passer au plan supérieur
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-success)]">Actions</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <a
                        href={selectedResourceDownloadHref ?? selectedResource.url}
                        download={selectedResource.originalTitle ?? selectedResource.title}
                        className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[var(--c-primary)] px-4 py-4 text-sm font-semibold text-[var(--text-on-primary)] transition hover:bg-[var(--c-primary-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-success)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
                      >
                        <Download className="h-4 w-4" />
                        Télécharger
                      </a>
                      <a
                        href={selectedResourceOpenHref ?? selectedResource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-surface)] px-4 py-4 text-sm font-semibold text-[var(--c-primary)] transition hover:border-[var(--c-primary)]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-success)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ouvrir
                      </a>
                    </div>
                    <Link
                      href={selectedResourceTutorHref}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-surface)] px-4 py-4 text-sm font-semibold text-[var(--c-primary)] transition hover:border-[var(--c-success)] hover:text-[var(--c-success)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-success)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
                    >
                      Reprendre cette ressource avec le guidage
                    </Link>
                  </>
                )}

                {(selectedResource.ext === '.webm' || selectedResource.ext === '.mkv' || selectedResource.ext === '.mp4') && (
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)]">
                        <Play className="h-4 w-4 text-[var(--c-success)]" />
                        Lecteur vidéo
                      </p>
                      <span className="rounded-full bg-[var(--c-success)]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-success)]">
                        {selectedResource.ext?.replace('.', '')}
                      </span>
                    </div>
                    <div className="aspect-video overflow-hidden rounded-[24px] bg-black shadow-[var(--shadow-md)]">
                      <video controls className="h-full w-full" src={selectedResourceOpenHref ?? selectedResource.url} poster="/images/logo_nexus_reussite.png" preload="metadata" playsInline>
                        <source src={selectedResourceOpenHref ?? selectedResource.url} type={getVideoMimeType(selectedResource)} />
                        Ton navigateur ne supporte pas la lecture vidéo.
                      </video>
                    </div>
                  </div>
                )}

                {selectedResource.ext === '.pdf' && (
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)]">
                        <FileText className="h-4 w-4 text-[var(--c-success)]" />
                        Aperçu PDF
                      </p>
                      <span className="rounded-full bg-[var(--c-success)]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-success)]">
                        PDF
                      </span>
                    </div>
                    <PdfPreviewViewer
                      src={selectedResourceOpenHref ?? selectedResource.url}
                      title={formatResourceTitle(selectedResource.title, selectedResource.ext)}
                    />
                    <p className="text-xs leading-6 text-[var(--text-muted)]">
                      Aperçu rendu dans la plateforme via PDF.js. Si un document résiste au rendu, les boutons ci-dessus restent la sortie fiable.
                    </p>
                  </div>
                )}
              </Surface>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
