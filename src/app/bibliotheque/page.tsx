'use client';

import { useMemo, useState } from 'react';
import { 
  Search, 
  Video, 
  BookOpen, 
  FileText, 
  X, 
  Download,
  Play,
  FolderOpen,
  BarChart3,
  GraduationCap,
  Filter,
  ExternalLink,
} from 'lucide-react';
import {
  RESSOURCES,
  type EafResource,
  type ResourceCategory,
  formatFileSize,
  formatResourceTitle,
  getResourceIcon,
  getCategoryLabel,
} from '@/data/ressources';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

const CATEGORY_ICONS: Record<ResourceCategory, typeof FolderOpen> = {
  'Annales_EAF': GraduationCap,
  'Oeuvres': BookOpen,
  'Videos': Video,
  'Documents_Extraits': FileText,
  'eaf_rapport_jury': BarChart3,
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

export default function BibliothequePage() {
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ragResults, setRagResults] = useState<RagResult[]>([]);
  const [selectedResource, setSelectedResource] = useState<EafResource | null>(null);

  const filteredResources = useMemo(() => {
    let resources = RESSOURCES;
    
    if (activeCategory !== 'all') {
      resources = resources.filter(r => r.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      resources = resources.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query) ||
        r.type.toLowerCase().includes(query)
      );
    }
    
    return resources;
  }, [activeCategory, searchQuery]);

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
    for (const r of RESSOURCES) {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    }
    return {
      total: RESSOURCES.length,
      byCategory,
    };
  }, []);

  const runRagSearch = async () => {
    if (!searchQuery.trim()) return;

    const response = await fetch('/api/v1/rag/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfTokenFromDocument(),
      },
      body: JSON.stringify({ query: searchQuery, maxResults: 8 }),
    });

    if (!response.ok) return;

    const payload = (await response.json()) as { results: RagResult[] };
    setRagResults(payload.results);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void runRagSearch();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* ─── Header ─── */}
      <header className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full translate-y-1/3 -translate-x-1/4" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Bibliothèque EAF</h1>
          </div>
          
          <p className="text-indigo-100 text-sm md:text-base max-w-2xl">
            Accède à toutes les ressources pédagogiques : annales, œuvres, vidéos, documents officiels et rapports de jury.
          </p>
          
          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-indigo-100">Ressources</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.byCategory['Annales_EAF'] || 0}</p>
              <p className="text-xs text-indigo-100">Annales</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.byCategory['Oeuvres'] || 0}</p>
              <p className="text-xs text-indigo-100">Œuvres</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.byCategory['Videos'] || 0}</p>
              <p className="text-xs text-indigo-100">Vidéos</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.byCategory['Documents_Extraits'] || 0}</p>
              <p className="text-xs text-indigo-100">Documents</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Search Bar ─── */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <label htmlFor="rag-query" className="sr-only">Recherche</label>
          <input
            id="rag-query"
            data-testid="rag-query"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Rechercher une ressource, une oeuvre, un auteur, une année..."
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm text-foreground text-sm"
          />
        </div>
        <button
          data-testid="rag-submit"
          onClick={() => void runRagSearch()}
          className="bg-primary text-primary-foreground px-5 py-3 rounded-2xl font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
        >
          Recherche RAG
        </button>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Filter className="w-4 h-4" /> Filtrer par:
        </span>
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
          }`}
        >
          Toutes les ressources
        </button>
        {CATEGORY_ORDER.map((category) => {
          const Icon = CATEGORY_ICONS[category];
          const count = RESSOURCES.filter(r => r.category === category).length;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                activeCategory === category
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {getCategoryLabel(category)}
              <span className="text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ─── RAG Results ─── */}
      {ragResults.length > 0 && (
        <div data-testid="rag-results" className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <p className="font-bold text-foreground text-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" /> {ragResults.length} résultats RAG
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ragResults.map((item) => (
              <div key={`${item.id}-${item.sourceRef}`} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border transition-all group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.sourceRef} · score {item.score.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Resources by Category ─── */}
      <div className="space-y-8">
        {CATEGORY_ORDER.map((category) => {
          const resources = groupedByCategory[category] || [];
          if (resources.length === 0) return null;
          
          const Icon = CATEGORY_ICONS[category];
          
          return (
            <section key={category} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  {getCategoryLabel(category)}
                  <span className="text-sm font-normal text-muted-foreground">({resources.length})</span>
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((resource) => (
                  <article 
                    key={resource.id} 
                    className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer"
                    onClick={() => setSelectedResource(resource)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:bg-primary/10 transition-colors">
                        {getResourceIcon(resource.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {formatResourceTitle(resource.title, resource.ext)}
                        </p>
                        
                        {resource.size && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(resource.size)}
                            {resource.ext && <span> · {resource.ext.toUpperCase()}</span>}
                          </p>
                        )}
                        
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {resource.year && (
                            <span className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-medium dark:bg-indigo-900/30 dark:text-indigo-400">
                              {resource.year}
                            </span>
                          )}
                          <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                            {resource.type.replace('_', ' ')}
                          </span>
                          {resource.ext === '.pdf' && (
                            <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-medium dark:bg-red-900/30 dark:text-red-400">
                              PDF
                            </span>
                          )}
                          {(resource.ext === '.webm' || resource.ext === '.mkv') && (
                            <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-medium dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
                              <Play className="w-3 h-3" /> Vidéo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* ─── Empty State ─── */}
      {filteredResources.length === 0 && (
        <div className="text-center py-16">
          <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Aucune ressource trouvée</p>
          <p className="text-sm text-muted-foreground mt-1">
            Essayez de modifier vos filtres ou votre recherche
          </p>
        </div>
      )}

      {/* ─── Resource Modal ─── */}
      {selectedResource && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm p-0 md:p-8 flex items-center justify-center"
          onClick={() => setSelectedResource(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-card border border-border rounded-none md:rounded-3xl w-full h-screen md:h-auto md:max-h-[85vh] md:max-w-2xl mx-auto overflow-auto p-6 md:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-3xl">
                  {getResourceIcon(selectedResource.type)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {formatResourceTitle(selectedResource.title, selectedResource.ext)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getCategoryLabel(selectedResource.category)} · {formatFileSize(selectedResource.size)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedResource(null)} 
                className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resource info */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm font-medium">
                  Type: {selectedResource.type.replace('_', ' ')}
                </span>
                <span className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm font-medium">
                  Format: {selectedResource.ext?.toUpperCase() || 'Inconnu'}
                </span>
                <span className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm font-medium">
                  Taille: {formatFileSize(selectedResource.size)}
                </span>
                {selectedResource.year && (
                  <span className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm font-medium">
                    Année: {selectedResource.year}
                  </span>
                )}
                {selectedResource.subject && (
                  <span className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm font-medium">
                    {selectedResource.subject}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <a
                href={selectedResource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </a>
              <a
                href={selectedResource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir
              </a>
            </div>

            {/* Preview for videos */}
            {(selectedResource.ext === '.webm' || selectedResource.ext === '.mkv' || selectedResource.ext === '.mp4') && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary" /> Lecteur Vidéo
                  </p>
                  <span className="text-xs text-muted-foreground px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                    {selectedResource.ext?.toUpperCase().replace('.', '')}
                  </span>
                </div>
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                  <video 
                    controls 
                    className="w-full h-full"
                    src={selectedResource.url}
                    poster="/images/logo_nexus_reussite.png"
                    preload="metadata"
                    playsInline
                  >
                    <source src={selectedResource.url} type={`video/${selectedResource.ext?.replace('.', '')}`} />
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" /> Lecture
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.828" />
                    </svg>
                    Volume
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Plein écran
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
