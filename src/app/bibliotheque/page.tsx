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
} from '@/components/ui/icons';
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
import { Badge, Button, StateNotice } from '@/components/ui';
import { useDialogAccessibility } from '@/components/ui/use-dialog-accessibility';

// Couleurs sémantiques par catégorie
const CATEGORY_COLORS: Record<ResourceCategory, { color: string; iconBg: string; badgeBg: string; badgeBorder: string; accent: string }> = {
  Annales_EAF: {
    color: 'var(--eaf-orange)',
    iconBg: 'rgba(255, 107, 53, 0.12)',
    badgeBg: 'rgba(255, 107, 53, 0.12)',
    badgeBorder: 'rgba(255, 107, 53, 0.3)',
    accent: 'var(--eaf-orange)',
  },
  Oeuvres: {
    color: 'var(--eaf-teal)',
    iconBg: 'rgba(26, 213, 160, 0.12)',
    badgeBg: 'rgba(26, 213, 160, 0.12)',
    badgeBorder: 'rgba(26, 213, 160, 0.3)',
    accent: 'var(--eaf-teal)',
  },
  Videos: {
    color: 'var(--eaf-indigo)',
    iconBg: 'rgba(123, 142, 255, 0.12)',
    badgeBg: 'rgba(123, 142, 255, 0.12)',
    badgeBorder: 'rgba(123, 142, 255, 0.3)',
    accent: 'var(--eaf-indigo)',
  },
  Documents_Extraits: {
    color: 'var(--eaf-gold)',
    iconBg: 'rgba(255, 181, 71, 0.12)',
    badgeBg: 'rgba(255, 181, 71, 0.12)',
    badgeBorder: 'rgba(255, 181, 71, 0.3)',
    accent: 'var(--eaf-gold)',
  },
  eaf_rapport_jury: {
    color: 'var(--eaf-indigo)',
    iconBg: 'rgba(123, 142, 255, 0.12)',
    badgeBg: 'rgba(123, 142, 255, 0.12)',
    badgeBorder: 'rgba(123, 142, 255, 0.3)',
    accent: 'var(--eaf-indigo)',
  },
};

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
  const [hasFullAccess, setHasFullAccess] = useState(false);
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
    colors: CATEGORY_COLORS[category],
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

        <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{
                background: 'rgba(123, 142, 255, 0.12)',
                color: 'var(--eaf-indigo)',
              }}
            >
              <BookOpen className="h-4 w-4" />
              Bibliothèque pédagogique
            </div>
            <h1
              className="mt-5 max-w-4xl text-4xl leading-tight text-white md:text-[44px]"
              style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1.5px' }}
            >
              Un fonds de travail EAF qui aide à avancer, pas un simple stock de fichiers.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
              Annales, œuvres, rapports de jury, documents et vidéos sont réunis dans un espace conçu pour réactiver
              vite une méthode, une œuvre ou un repère utile juste avant un atelier, un oral ou une révision ciblée.
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              { label: 'Ressources actives', value: String(stats.total).padStart(2, '0'), color: 'indigo' as const },
              { label: 'Catégories pilotées', value: String(CATEGORY_ORDER.length).padStart(2, '0'), color: 'gold' as const },
              { label: 'Usage conseillé', value: 'Court + ciblé', color: 'teal' as const },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl px-4 py-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: `var(--eaf-${item.color})` }}
                >
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Freemium notice */}
      {!hasFullAccess && (
        <section
          className="rounded-xl border px-6 py-5"
          style={{
            background: 'var(--eaf-bg2)',
            borderColor: 'rgba(255, 181, 71, 0.2)',
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--eaf-gold)' }} />
              <div>
                <p className="text-sm font-semibold text-[var(--eaf-fg0)]">
                  Tu accèdes à {FREE_TOTAL_LIMIT} ressources sur {LIBRARY_TOTAL_RESOURCES} avec le plan Freemium.
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--eaf-fg2)]">
                  Les ressources verrouillées restent visibles. Passe à Premium pour toutes les débloquer.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition hover:scale-[1.02]"
              style={{ background: 'var(--eaf-orange)', color: '#050913' }}
            >
              Passer au plan supérieur
            </Link>
          </div>
        </section>
      )}

      {/* Section recherche */}
      <section
        className="rounded-xl p-5 md:p-6"
        style={{
          background: 'var(--eaf-bg1)',
          border: '1px solid rgba(123, 142, 255, 0.12)',
        }}
      >
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-indigo)]">
              Recherche assistée
            </p>
            <h2
              className="mt-3 text-3xl leading-tight text-[var(--eaf-fg0)]"
              style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1px' }}
            >
              Cherche par besoin réel : œuvre, auteur, méthode, rapport ou question précise.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--eaf-fg2)]">
              La recherche standard filtre le catalogue. La recherche intelligente tente en plus de remonter les passages les
              plus pertinents pour ta requête.
            </p>
          </div>

          {/* Accès direct catégories */}
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {highlightedCategories.slice(0, 3).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.category}
                  onClick={() => setActiveCategory(item.category)}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'var(--eaf-bg2)',
                    borderColor: 'rgba(123, 142, 255, 0.15)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: item.colors.iconBg, color: item.colors.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--eaf-fg0)]">{item.label}</p>
                      <p className="text-xs text-[var(--eaf-fg3)]">{item.count} ressources</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--eaf-fg3)]" />
            <label htmlFor="rag-query" className="sr-only">Recherche</label>
            <input
              id="rag-query"
              data-testid="rag-query"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Exemple : explication linéaire, problématique dissertation, Rimbaud, rapport jury..."
              className="w-full rounded-xl border px-11 py-4 text-sm outline-none transition-all duration-200 placeholder:text-[var(--eaf-fg3)] focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20"
              style={{
                borderColor: 'rgba(123, 142, 255, 0.2)',
                background: 'var(--eaf-bg2)',
                color: 'var(--eaf-fg0)',
              }}
            />
          </div>
          <Button
            data-testid="rag-submit"
            onClick={() => void runRagSearch()}
            loading={isSearching}
            icon={!isSearching ? <Search className="h-4 w-4" /> : undefined}
            size="lg"
            className="rounded-xl font-semibold"
            style={{
              background: 'var(--eaf-indigo)',
              color: '#050913',
            }}
          >
            {isSearching ? 'Recherche…' : 'Recherche intelligente'}
          </Button>
        </div>

        {/* Filter pills */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--eaf-fg3)]">
            <Filter className="h-4 w-4" />
            Filtrer
          </span>
          <button
            onClick={() => setActiveCategory('all')}
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeCategory === 'all'
                ? 'bg-[rgba(123,142,255,0.15)] text-[var(--eaf-indigo)] border border-[var(--eaf-indigo)]/30'
                : 'border border-[rgba(123,142,255,0.15)] bg-[var(--eaf-bg2)] text-[var(--eaf-fg1)] hover:border-[rgba(123,142,255,0.3)]'
            }`}
          >
            Toutes les ressources
          </button>
          {CATEGORY_ORDER.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            const count = RESSOURCES.filter((resource) => resource.category === category).length;
            const colors = CATEGORY_COLORS[category];
            const isActive = activeCategory === category;
            
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? ''
                    : 'border border-[rgba(123,142,255,0.15)] bg-[var(--eaf-bg2)] text-[var(--eaf-fg1)] hover:border-[rgba(123,142,255,0.3)]'
                }`}
                style={{
                  background: isActive ? colors.badgeBg : undefined,
                  borderColor: isActive ? colors.badgeBorder : undefined,
                  color: isActive ? colors.color : undefined,
                }}
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
        <section
          data-testid="rag-results"
          className="rounded-xl border p-5 md:p-6"
          style={{
            background: 'var(--eaf-teal)/5',
            borderColor: 'var(--eaf-teal)/20',
          }}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-teal)]">
                Résultats de recherche
              </p>
              <h2
                className="mt-2 text-3xl leading-tight text-[var(--eaf-fg0)]"
                style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1px' }}
              >
                Passages remontés pour "{searchQuery}".
              </h2>
            </div>
            <p className="text-sm text-[var(--eaf-teal)]">{ragResults.length} résultats priorisés</p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {ragResults.map((item) => (
              <article
                key={`${item.id}-${item.sourceRef}`}
                className="rounded-xl border p-4"
                style={{
                  background: 'var(--eaf-bg1)',
                  borderColor: 'rgba(123, 142, 255, 0.1)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'var(--eaf-teal)/10', color: 'var(--eaf-teal)' }}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold leading-6 text-[var(--eaf-fg0)]">{item.title}</p>
                      <Badge
                        size="sm"
                        className="uppercase tracking-[0.14em] border-0"
                        style={{ background: 'var(--eaf-teal)/10', color: 'var(--eaf-teal)' }}
                      >
                        score {item.score.toFixed(2)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--eaf-fg3)]">{item.sourceRef} · {item.type} · {item.level}</p>
                    <p className="mt-3 text-sm leading-7 text-[var(--eaf-fg2)]">{item.excerpt}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Catalogue par catégorie */}
      <div className="space-y-8">
        {CATEGORY_ORDER.map((category) => {
          const resources = groupedByCategory[category] || [];
          if (resources.length === 0) return null;

          const Icon = CATEGORY_ICONS[category];
          const colors = CATEGORY_COLORS[category];

          return (
            <section key={category} className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-fg3)]">
                    Catalogue vivant
                  </p>
                  <h2
                    className="mt-2 flex items-center gap-3 text-2xl font-semibold text-[var(--eaf-fg0)]"
                    style={{ fontFamily: 'var(--font-heading, Fraunces, serif)' }}
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ background: colors.iconBg, color: colors.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {getCategoryLabel(category)}
                  </h2>
                </div>
                <p className="text-sm text-[var(--eaf-fg3)]">{resources.length} ressources visibles</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {resources.map((resource) => {
                  const locked = isResourceLocked(resource);
                  const resourceColors = CATEGORY_COLORS[resource.category];
                  
                  return (
                    <article
                      key={resource.id}
                      className="group cursor-pointer overflow-hidden rounded-xl border transition-all duration-200"
                      style={{
                        background: 'var(--eaf-bg1)',
                        borderColor: 'rgba(123, 142, 255, 0.12)',
                      }}
                      onClick={() => setSelectedResource(resource)}
                    >
                      {/* Accent bar on hover */}
                      <div
                        className="h-[3px] w-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        style={{ background: resourceColors.accent }}
                      />
                      
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-3xl transition ${
                              locked ? 'grayscale opacity-60' : ''
                            }`}
                            style={{ background: resourceColors.iconBg }}
                          >
                            {locked ? (
                              <Lock className="h-6 w-6" style={{ color: 'var(--eaf-fg3)' }} />
                            ) : (
                              getResourceIcon(resource.type)
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-2">
                              <span
                                className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                                style={{
                                  background: locked ? 'var(--eaf-bg3)' : resourceColors.badgeBg,
                                  border: `1px solid ${locked ? 'rgba(123,142,255,0.1)' : resourceColors.badgeBorder}`,
                                  color: locked ? 'var(--eaf-fg3)' : resourceColors.color,
                                }}
                              >
                                {resource.type.replace('_', ' ')}
                              </span>
                              {resource.year && (
                                <span
                                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                                  style={{
                                    background: 'var(--eaf-bg3)',
                                    border: '1px solid rgba(123,142,255,0.1)',
                                    color: 'var(--eaf-fg2)',
                                  }}
                                >
                                  {resource.year}
                                </span>
                              )}
                              {resource.ext && (
                                <span
                                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                                  style={{
                                    background: 'var(--eaf-bg3)',
                                    border: '1px solid rgba(123,142,255,0.1)',
                                    color: 'var(--eaf-fg2)',
                                  }}
                                >
                                  {resource.ext.replace('.', '')}
                                </span>
                              )}
                              {locked && (
                                <Badge
                                  size="sm"
                                  className="uppercase tracking-[0.12em] border-0"
                                  style={{ background: 'var(--eaf-bg3)', color: 'var(--eaf-fg3)' }}
                                >
                                  Premium
                                </Badge>
                              )}
                            </div>
                            <p
                              className={`mt-3 line-clamp-2 text-base font-semibold leading-7 transition ${
                                locked ? 'text-[var(--eaf-fg3)]' : 'text-[var(--eaf-fg0)] group-hover:text-[var(--eaf-indigo)]'
                              }`}
                            >
                              {formatResourceTitle(resource.title, resource.ext)}
                            </p>
                            <p
                              className={`mt-2 line-clamp-3 text-sm leading-6 ${
                                locked ? 'text-[var(--eaf-fg3)]' : 'text-[var(--eaf-fg2)]'
                              }`}
                            >
                              {buildResourceDescription(resource)}
                            </p>
                            <div
                              className={`mt-4 flex items-center justify-between border-t pt-3 text-xs ${
                                locked ? 'text-[var(--eaf-fg3)]' : 'text-[var(--eaf-fg2)]'
                              }`}
                              style={{ borderColor: 'rgba(123, 142, 255, 0.08)' }}
                            >
                              <span>{formatFileSize(resource.size) || 'Taille non précisée'}</span>
                              {locked ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-[var(--eaf-fg3)]">
                                  <Lock className="h-3 w-3" />
                                  Verrouillée
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-semibold text-[var(--eaf-indigo)]">
                                  Ouvrir la fiche
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>
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
          description="Essaie d'élargir ta recherche ou de revenir sur « Toutes les ressources » pour retrouver l'ensemble du catalogue."
          variant="empty"
          icon={FolderOpen}
          center
          className="px-6 py-12"
          action={
            <Button
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              size="md"
              className="rounded-xl border font-semibold"
              style={{
                borderColor: 'rgba(123, 142, 255, 0.2)',
                background: 'var(--eaf-bg2)',
                color: 'var(--eaf-fg1)',
              }}
            >
              Voir toutes les ressources
            </Button>
          }
        />
      )}

      {/* Modale fiche ressource - DARK THEME */}
      {selectedResource && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-0 md:p-8"
          style={{
            background: 'rgba(5, 9, 19, 0.88)',
            backdropFilter: 'blur(10px)',
          }}
          onClick={closeSelectedResource}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-resource-title"
            aria-describedby="library-resource-description"
            tabIndex={-1}
            className="h-screen w-full overflow-auto rounded-none border-0 p-6 shadow-2xl md:h-auto md:max-h-[88vh] md:max-w-2xl md:rounded-xl md:border md:p-8"
            style={{
              background: 'var(--eaf-bg1)',
              borderColor: 'rgba(123, 142, 255, 0.15)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(123,142,255,0.08)',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-4xl"
                  style={{
                    background: CATEGORY_COLORS[selectedResource.category].iconBg,
                  }}
                >
                  {getResourceIcon(selectedResource.type)}
                </div>
                <div className="min-w-0">
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.24em]"
                    style={{ color: CATEGORY_COLORS[selectedResource.category].color }}
                  >
                    Fiche ressource
                  </p>
                  <h3
                    id="library-resource-title"
                    className="mt-2 text-3xl leading-tight text-[var(--eaf-fg0)]"
                    style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1px' }}
                  >
                    {formatResourceTitle(selectedResource.title, selectedResource.ext)}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--eaf-fg3)]">
                    {getCategoryLabel(selectedResource.category)} · {formatFileSize(selectedResource.size) || 'Taille non précisée'}
                  </p>
                </div>
              </div>
              <button
                ref={dialogCloseRef}
                onClick={closeSelectedResource}
                className="flex h-11 w-11 items-center justify-center rounded-xl transition"
                style={{
                  background: 'var(--eaf-bg2)',
                  border: '1px solid rgba(123, 142, 255, 0.15)',
                  color: 'var(--eaf-fg2)',
                }}
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Corps - Grid 2 colonnes */}
            <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              {/* Colonne gauche - Pourquoi l'ouvrir */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: 'var(--eaf-bg2)',
                  border: '1px solid rgba(123, 142, 255, 0.1)',
                }}
              >
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.24em]"
                  style={{ color: CATEGORY_COLORS[selectedResource.category].color }}
                >
                  Pourquoi l'ouvrir
                </p>
                <p id="library-resource-description" className="mt-3 text-sm leading-7 text-[var(--eaf-fg2)]">
                  {buildResourceDescription(selectedResource)}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      background: 'var(--eaf-bg3)',
                      border: '1px solid rgba(123,142,255,0.1)',
                      color: 'var(--eaf-fg2)',
                    }}
                  >
                    Type: {selectedResource.type.replace('_', ' ')}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      background: CATEGORY_COLORS[selectedResource.category].badgeBg,
                      border: `1px solid ${CATEGORY_COLORS[selectedResource.category].badgeBorder}`,
                      color: CATEGORY_COLORS[selectedResource.category].color,
                    }}
                  >
                    Format : {selectedResource.ext?.toUpperCase() || 'Inconnu'}
                  </span>
                  {selectedResource.year && (
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        background: 'var(--eaf-bg3)',
                        border: '1px solid rgba(123,142,255,0.1)',
                        color: 'var(--eaf-fg2)',
                      }}
                    >
                      Année: {selectedResource.year}
                    </span>
                  )}
                  {selectedResource.subject && (
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        background: 'var(--eaf-indigo)/10',
                        border: '1px solid var(--eaf-indigo)/20',
                        color: 'var(--eaf-indigo)',
                      }}
                    >
                      {selectedResource.subject}
                    </span>
                  )}
                </div>
              </div>

              {/* Colonne droite - Actions */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: 'var(--eaf-bg2)',
                  border: '1px solid rgba(123, 142, 255, 0.1)',
                }}
              >
                {selectedResource && isResourceLocked(selectedResource) ? (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-gold)]">
                      Ressource verrouillée
                    </p>
                    <div
                      className="mt-4 rounded-lg border p-5 text-center"
                      style={{
                        background: 'var(--eaf-bg1)',
                        borderColor: 'rgba(123, 142, 255, 0.1)',
                      }}
                    >
                      <Lock className="mx-auto h-8 w-8 text-[var(--eaf-fg3)]" />
                      <p className="mt-3 text-sm font-semibold text-[var(--eaf-fg0)]">
                        Cette ressource fait partie des {LIBRARY_TOTAL_RESOURCES - FREE_TOTAL_LIMIT} contenus réservés aux abonnés.
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--eaf-fg2)]">
                        Passe à Premium pour débloquer les {LIBRARY_TOTAL_RESOURCES} ressources de la bibliothèque complète.
                      </p>
                      <Link
                        href="/pricing"
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition hover:scale-[1.02]"
                        style={{ background: 'var(--eaf-orange)', color: '#050913' }}
                      >
                        Passer au plan supérieur
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-teal)]">
                      Actions
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <a
                        href={selectedResourceDownloadHref ?? selectedResource.url}
                        download={selectedResource.originalTitle ?? selectedResource.title}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-semibold transition hover:scale-[1.02]"
                        style={{ background: 'var(--eaf-orange)', color: '#050913' }}
                      >
                        <Download className="h-4 w-4" />
                        Télécharger
                      </a>
                      <a
                        href={selectedResourceOpenHref ?? selectedResource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-4 text-sm font-semibold transition"
                        style={{
                          borderColor: 'rgba(123, 142, 255, 0.2)',
                          background: 'var(--eaf-bg1)',
                          color: 'var(--eaf-fg0)',
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ouvrir
                      </a>
                    </div>
                    <Link
                      href={selectedResourceTutorHref}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-4 text-sm font-semibold transition hover:border-[var(--eaf-teal)] hover:text-[var(--eaf-teal)]"
                      style={{
                        borderColor: 'rgba(123, 142, 255, 0.2)',
                        background: 'var(--eaf-bg1)',
                        color: 'var(--eaf-fg0)',
                      }}
                    >
                      Reprendre cette ressource avec le guidage
                    </Link>
                  </>
                )}

                {/* Lecteur vidéo */}
                {(selectedResource.ext === '.webm' || selectedResource.ext === '.mkv' || selectedResource.ext === '.mp4') && (
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--eaf-fg0)]">
                        <Play className="h-4 w-4" style={{ color: 'var(--eaf-indigo)' }} />
                        Lecteur vidéo
                      </p>
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={{
                          background: 'var(--eaf-indigo)/10',
                          color: 'var(--eaf-indigo)',
                        }}
                      >
                        {selectedResource.ext?.replace('.', '')}
                      </span>
                    </div>
                    <div
                      className="aspect-video overflow-hidden rounded-xl"
                      style={{ background: '#000' }}
                    >
                      <video
                        controls
                        className="h-full w-full"
                        src={selectedResourceOpenHref ?? selectedResource.url}
                        poster="/images/logo_nexus_reussite.png"
                        preload="metadata"
                        playsInline
                      >
                        <source src={selectedResourceOpenHref ?? selectedResource.url} type={getVideoMimeType(selectedResource)} />
                        Ton navigateur ne supporte pas la lecture vidéo.
                      </video>
                    </div>
                  </div>
                )}

                {/* Viewer PDF */}
                {selectedResource.ext === '.pdf' && (
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--eaf-fg0)]">
                        <FileText className="h-4 w-4" style={{ color: 'var(--eaf-gold)' }} />
                        Aperçu PDF
                      </p>
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={{
                          background: 'var(--eaf-gold)/10',
                          color: 'var(--eaf-gold)',
                        }}
                      >
                        PDF
                      </span>
                    </div>
                    <PdfPreviewViewer
                      src={selectedResourceOpenHref ?? selectedResource.url}
                      title={formatResourceTitle(selectedResource.title, selectedResource.ext)}
                    />
                    <p className="text-xs leading-6 text-[var(--eaf-fg3)]">
                      Aperçu rendu dans la plateforme via PDF.js. Si un document résiste au rendu, les boutons ci-dessus restent la sortie fiable.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
