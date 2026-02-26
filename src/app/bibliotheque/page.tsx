'use client';

import { useMemo, useState } from 'react';
import { Search, Video, Headphones, BookMarked, FileText, BookOpen, ExternalLink, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { OFFICIAL_REFERENCES, type ReferenceDoc, type ResourceType } from '@/data/references';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

const TYPE_LABELS: Record<ResourceType, string> = {
  fiche_methode: 'Fiches méthode',
  texte_officiel: 'Textes officiels',
  video: 'Vidéos',
  audio: 'Podcasts',
  exemple_corrige: 'Exemples corrigés',
  oeuvre: 'Œuvres',
};

const TYPE_ICONS: Record<ResourceType, typeof Video> = {
  video: Video,
  audio: Headphones,
  fiche_methode: BookMarked,
  texte_officiel: FileText,
  exemple_corrige: FileText,
  oeuvre: BookOpen,
};

const TYPE_ORDER: ResourceType[] = [
  'fiche_methode',
  'texte_officiel',
  'video',
  'audio',
  'exemple_corrige',
  'oeuvre',
];

type RagResult = {
  id: string;
  title: string;
  type: ResourceType;
  level: string;
  excerpt: string;
  sourceRef: string;
  score: number;
};

export default function BibliothequePage() {
  const [activeType, setActiveType] = useState<ResourceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ragResults, setRagResults] = useState<RagResult[]>([]);
  const [modalDoc, setModalDoc] = useState<ReferenceDoc | null>(null);

  const filtered = useMemo(() => {
    if (activeType === 'all') {
      return OFFICIAL_REFERENCES;
    }
    return OFFICIAL_REFERENCES.filter((item) => item.type === activeType);
  }, [activeType]);

  const grouped = useMemo(() => {
    const source = filtered;
    return TYPE_ORDER.map((type) => ({
      type,
      items: source.filter((item) => item.type === type),
    })).filter((group) => group.items.length > 0);
  }, [filtered]);

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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Bibliothèque RAG</h1>
        <p className="text-muted-foreground mt-2">Explore le corpus officiel, les fiches méthodes et les ressources multimédias.</p>
      </header>

      {/* ─── Search Bar ─── */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <label htmlFor="rag-query" className="sr-only">Recherche RAG</label>
          <input
            id="rag-query"
            data-testid="rag-query"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Rechercher une notion, une oeuvre, un auteur..."
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm text-foreground text-sm"
          />
        </div>
        <button
          data-testid="rag-submit"
          onClick={() => void runRagSearch()}
          className="bg-primary text-primary-foreground px-5 py-3 rounded-2xl font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          Rechercher
        </button>
      </div>

      {/* ─── Filter Tags ─── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveType('all')}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeType === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
          }`}
        >
          Tous
        </button>
        {TYPE_ORDER.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeType === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
            }`}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* ─── RAG Results ─── */}
      <div data-testid="rag-results">
        {ragResults.length > 0 && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
            <p className="font-bold text-foreground text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" /> {ragResults.length} résultats RAG
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ragResults.map((item) => {
                const Icon = TYPE_ICONS[item.type] ?? FileText;
                return (
                  <div key={`${item.id}-${item.sourceRef}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-md hover:border-primary/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{TYPE_LABELS[item.type]} &middot; score {item.score.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Grouped Resources ─── */}
      <div className="space-y-8">
        {grouped.map((group) => (
          <section key={group.type} className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">{TYPE_LABELS[group.type]}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.items.map((item) => {
                const Icon = TYPE_ICONS[item.type] ?? FileText;
                return (
                  <article key={item.id} className="bg-card p-5 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all flex gap-4 group">
                    <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <p className="font-bold text-foreground mb-1 leading-tight">{item.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.excerpt}</p>
                      </div>

                      <div className="text-xs text-muted-foreground">{item.source} &middot; {item.level}</div>

                      {item.type === 'video' && item.mediaUrl && (
                        <iframe
                          title={item.title}
                          src={item.mediaUrl}
                          loading="lazy"
                          className="w-full aspect-video rounded-xl border border-border"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      )}

                      {item.type === 'audio' && item.mediaUrl && (
                        <audio controls className="w-full" src={item.mediaUrl}>
                          Votre navigateur ne supporte pas la lecture audio.
                        </audio>
                      )}

                      <div className="flex gap-2 flex-wrap pt-1">
                        <span className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm font-medium text-muted-foreground inline-flex items-center gap-1.5">
                          <FileText className="w-3 h-3" /> {item.sourceRef}
                        </span>
                        {item.type === 'fiche_methode' && (
                          <button onClick={() => setModalDoc(item)}
                            className="px-3 py-1.5 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
                          >
                            Lire la fiche
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* ─── Modal ─── */}
      {modalDoc && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm p-0 md:p-8" onClick={() => setModalDoc(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fiche-method-title"
            className="bg-card border border-border rounded-none md:rounded-3xl w-full h-screen md:h-auto md:max-h-[85vh] md:max-w-3xl mx-auto overflow-auto p-6 md:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 id="fiche-method-title" className="text-xl font-bold text-foreground">{modalDoc.title}</h3>
              <button onClick={() => setModalDoc(null)} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {modalDoc.markdownContent ?? modalDoc.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
