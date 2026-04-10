'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist/types/src/display/api';

type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

type PdfPreviewViewerProps = {
  src: string;
  title: string;
};

type FitMode = 'auto' | 'width' | 'page';

type SearchResult = {
  pageNumber: number;
  snippet: string;
};

let pdfJsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    pdfJsPromise = import('pdfjs-dist/legacy/build/pdf.mjs').then((module) => {
      module.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
      return module;
    });
  }

  return pdfJsPromise;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchSnippet(pageText: string, query: string): string {
  const text = pageText.replace(/\s+/g, ' ').trim();
  if (!text) {
    return 'Page sans contenu textuel exploitable.';
  }

  const queryLower = query.toLowerCase();
  const directIndex = text.toLowerCase().indexOf(queryLower);

  if (directIndex >= 0) {
    const start = Math.max(0, directIndex - 48);
    const end = Math.min(text.length, directIndex + query.length + 88);
    return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
  }

  return `${text.slice(0, 136).trim()}${text.length > 136 ? '…' : ''}`;
}

function getVisibleThumbnailPages(pageCount: number, currentPage: number): number[] {
  if (pageCount <= 8) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, pageCount]);
  for (let page = currentPage - 3; page <= currentPage + 3; page += 1) {
    if (page > 1 && page < pageCount) {
      pages.add(page);
    }
  }

  return Array.from(pages).sort((left, right) => left - right);
}

function PdfThumbnail({
  pdfDocument,
  pageNumber,
  isActive,
  onSelect,
}: {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: RenderTask | null = null;

    const renderThumbnail = async () => {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const thumbnailWidth = 92;
        const scale = thumbnailWidth / baseViewport.width;
        const cssViewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        const renderViewport = page.getViewport({ scale: scale * outputScale });

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(cssViewport.width)}px`;
        canvas.style.height = `${Math.floor(cssViewport.height)}px`;

        renderTask?.cancel();
        renderTask = page.render({
          canvas,
          viewport: renderViewport,
        });

        await renderTask.promise;
      } catch (cause) {
        const errorName = cause instanceof Error ? cause.name : '';
        if (!cancelled && errorName !== 'RenderingCancelledException') {
          const canvas = canvasRef.current;
          const context = canvas?.getContext('2d');
          if (canvas && context) {
            canvas.width = 92;
            canvas.height = 126;
            context.fillStyle = '#f8f4ec';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#17324d';
            context.font = '12px sans-serif';
            context.fillText(String(pageNumber), 12, 24);
          }
        }
      }
    };

    void renderThumbnail();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pageNumber, pdfDocument]);

  return (
    <button
      type="button"
      data-testid={`pdf-preview-thumbnail-${pageNumber}`}
      onClick={onSelect}
      className={`group flex shrink-0 flex-col items-center gap-2 rounded-[18px] border px-2 py-2 transition ${
        isActive
          ? 'border-[var(--c-success)] bg-[var(--bg-success)] shadow-[0_12px_24px_rgba(15,118,110,0.12)]'
          : 'border-[var(--border-strong)] bg-[var(--bg-surface)] hover:border-[var(--c-primary)]/18'
      }`}
      aria-label={`Aller à la page ${pageNumber}`}
    >
      <canvas
        ref={canvasRef}
        className="rounded-[10px] bg-[var(--bg-surface)] shadow-[0_8px_20px_rgba(23,50,77,0.10)]"
      />
      <span className={`text-xs font-semibold ${isActive ? 'text-[var(--c-success)]' : 'text-[var(--text-secondary)]'}`}>
        {pageNumber}
      </span>
    </button>
  );
}

export function PdfPreviewViewer({ src, title }: PdfPreviewViewerProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const pageTextCacheRef = useRef(new Map<number, string>());
  const searchRunIdRef = useRef(0);
  const sidebarTouchedRef = useRef(false);

  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<FitMode>('auto');
  const [resolvedAutoFitMode, setResolvedAutoFitMode] = useState<'width' | 'page'>('width');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeSearchResultIndex, setActiveSearchResultIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      setViewportSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (viewportSize.width === 0 || sidebarTouchedRef.current) {
      return;
    }

    setIsSidebarCollapsed(viewportSize.width < 820);
  }, [viewportSize.width]);

  useEffect(() => {
    let cancelled = false;

    const loadDocument = async () => {
      setIsLoadingDocument(true);
      setError(null);
      setPageCount(0);
      setPageNumber(1);
      setZoom(1);
      setFitMode('auto');
      setResolvedAutoFitMode('width');
      setSearchQuery('');
      setSearchResults([]);
      setActiveSearchResultIndex(0);
      setSearchMessage(null);
      setIsSearching(false);
      searchRunIdRef.current += 1;
      pageTextCacheRef.current.clear();
      sidebarTouchedRef.current = false;

      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;

      const currentDocument = documentRef.current;
      documentRef.current = null;
      if (currentDocument) {
        await currentDocument.destroy().catch(() => undefined);
      }

      try {
        const pdfJs = await loadPdfJs();
        const loadingTask = pdfJs.getDocument({
          url: src,
          withCredentials: true,
          isEvalSupported: false,
        });

        const pdfDocument = await loadingTask.promise;
        if (cancelled) {
          await pdfDocument.destroy().catch(() => undefined);
          return;
        }

        documentRef.current = pdfDocument;
        setPageCount(pdfDocument.numPages);
        requestAnimationFrame(() => viewerRef.current?.focus());
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Aperçu PDF indisponible.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDocument(false);
        }
      }
    };

    void loadDocument();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
      const currentDocument = documentRef.current;
      documentRef.current = null;
      void currentDocument?.destroy().catch(() => undefined);
    };
  }, [reloadNonce, src]);

  useEffect(() => {
    const pdfDocument = documentRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!pdfDocument || !canvas || !container || viewportSize.width === 0 || viewportSize.height === 0) {
      return;
    }

    let cancelled = false;

    const renderPage = async () => {
      setIsRenderingPage(true);
      setError(null);

      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = Math.max(viewportSize.width - 32, 280);
        const targetHeight = Math.max(viewportSize.height - 32, 280);
        const widthScale = targetWidth / baseViewport.width;
        const pageScale = Math.min(widthScale, targetHeight / baseViewport.height);
        const computedFitMode = fitMode === 'auto' ? (pageScale < widthScale * 0.98 ? 'page' : 'width') : fitMode;
        const baseScale = computedFitMode === 'page' ? pageScale : widthScale;
        const effectiveScale = clamp(baseScale * zoom, 0.6, 4);
        const cssViewport = page.getViewport({ scale: effectiveScale });
        const outputScale = window.devicePixelRatio || 1;
        const renderViewport = page.getViewport({ scale: effectiveScale * outputScale });

        setResolvedAutoFitMode(computedFitMode);

        if (!canvas.getContext('2d', { alpha: false })) {
          throw new Error('Canvas 2D indisponible.');
        }

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(cssViewport.width)}px`;
        canvas.style.height = `${Math.floor(cssViewport.height)}px`;

        renderTaskRef.current?.cancel();
        const renderTask = page.render({
          canvas,
          viewport: renderViewport,
        });

        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (cause) {
        const errorName = cause instanceof Error ? cause.name : '';
        if (!cancelled && errorName !== 'RenderingCancelledException') {
          setError(cause instanceof Error ? cause.message : 'Rendu PDF impossible.');
        }
      } finally {
        if (!cancelled) {
          setIsRenderingPage(false);
        }
      }
    };

    void renderPage();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [fitMode, pageNumber, src, viewportSize.height, viewportSize.width, zoom]);

  const zoomLabel = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom]);
  const fitLabel = useMemo(() => {
    if (fitMode === 'auto') {
      return `Auto (${resolvedAutoFitMode === 'page' ? 'page' : 'largeur'})`;
    }

    return fitMode === 'page' ? 'Ajuster page' : 'Ajuster largeur';
  }, [fitMode, resolvedAutoFitMode]);
  const thumbnailPages = useMemo(() => getVisibleThumbnailPages(pageCount, pageNumber), [pageCount, pageNumber]);
  const visibleSearchResults = useMemo(() => {
    if (searchResults.length <= 8) {
      return searchResults.map((result, index) => ({ result, index }));
    }

    const start = clamp(activeSearchResultIndex - 3, 0, Math.max(0, searchResults.length - 8));
    return searchResults.slice(start, start + 8).map((result, offset) => ({
      result,
      index: start + offset,
    }));
  }, [activeSearchResultIndex, searchResults]);
  const currentSearchResult = searchResults[activeSearchResultIndex] ?? null;

  const canGoBackward = pageNumber > 1;
  const canGoForward = pageCount > 0 && pageNumber < pageCount;
  const isBusy = isLoadingDocument || isRenderingPage;
  const pdfDocument = documentRef.current;

  const applyZoomDelta = (delta: number) => {
    setZoom((current) => clamp(Number((current + delta).toFixed(2)), 0.6, 2.2));
  };

  const applyFitMode = (mode: FitMode) => {
    setFitMode(mode);
    setZoom(1);
  };

  const goToSearchResult = (index: number) => {
    const result = searchResults[index];
    if (!result) return;

    setActiveSearchResultIndex(index);
    setPageNumber(result.pageNumber);
  };

  const toggleSidebar = () => {
    sidebarTouchedRef.current = true;
    setIsSidebarCollapsed((current) => !current);
  };

  const getPageSearchText = async (pdfDocumentToSearch: PDFDocumentProxy, pageToRead: number) => {
    const cached = pageTextCacheRef.current.get(pageToRead);
    if (cached) {
      return cached;
    }

    const page = await pdfDocumentToSearch.getPage(pageToRead);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    pageTextCacheRef.current.set(pageToRead, pageText);
    return pageText;
  };

  const runSearch = async (query: string) => {
    const pdfDocumentToSearch = documentRef.current;
    const trimmedQuery = query.trim();
    const requestId = searchRunIdRef.current + 1;
    searchRunIdRef.current = requestId;

    if (!pdfDocumentToSearch || !trimmedQuery) {
      setSearchResults([]);
      setActiveSearchResultIndex(0);
      setSearchMessage(trimmedQuery ? 'Document encore indisponible pour la recherche.' : 'Saisissez un mot-clé pour interroger le PDF.');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchMessage(null);

    try {
      const normalizedQuery = normalizeSearchText(trimmedQuery);
      const nextResults: SearchResult[] = [];

      for (let currentPage = 1; currentPage <= pdfDocumentToSearch.numPages; currentPage += 1) {
        const pageText = await getPageSearchText(pdfDocumentToSearch, currentPage);
        if (searchRunIdRef.current !== requestId) {
          return;
        }

        if (!pageText) {
          continue;
        }

        const matchesDirect = pageText.toLowerCase().includes(trimmedQuery.toLowerCase());
        const matchesNormalized = normalizeSearchText(pageText).includes(normalizedQuery);

        if (matchesDirect || matchesNormalized) {
          nextResults.push({
            pageNumber: currentPage,
            snippet: buildSearchSnippet(pageText, trimmedQuery),
          });
        }

        if (nextResults.length >= 24) {
          break;
        }
      }

      if (searchRunIdRef.current !== requestId) {
        return;
      }

      setSearchResults(nextResults);
      setActiveSearchResultIndex(0);

      if (nextResults.length === 0) {
        setSearchMessage('Aucun résultat dans ce document.');
        return;
      }

      setPageNumber(nextResults[0].pageNumber);
      setSearchMessage(
        `${nextResults.length} résultat${nextResults.length > 1 ? 's' : ''}${nextResults.length === 24 ? ' (limite affichée)' : ''}.`,
      );
    } catch {
      if (searchRunIdRef.current === requestId) {
        setSearchMessage('Recherche temporairement indisponible sur ce document.');
      }
    } finally {
      if (searchRunIdRef.current === requestId) {
        setIsSearching(false);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const isEditableTarget =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.getAttribute('contenteditable') === 'true';

    if (isEditableTarget) {
      return;
    }

    if (isBusy) return;

    if (event.key === 'ArrowLeft' && canGoBackward) {
      event.preventDefault();
      setPageNumber((current) => Math.max(1, current - 1));
      return;
    }

    if (event.key === 'ArrowRight' && canGoForward) {
      event.preventDefault();
      setPageNumber((current) => Math.min(pageCount, current + 1));
      return;
    }

    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      applyZoomDelta(0.15);
      return;
    }

    if (event.key === '-') {
      event.preventDefault();
      applyZoomDelta(-0.15);
      return;
    }

    if (event.key === '0') {
      event.preventDefault();
      setZoom(1);
      return;
    }

    if (event.key === '/') {
      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
      return;
    }

    if (event.key.toLowerCase() === 'w') {
      event.preventDefault();
      applyFitMode('width');
      return;
    }

    if (event.key.toLowerCase() === 'p') {
      event.preventDefault();
      applyFitMode('page');
      return;
    }

    if (event.key.toLowerCase() === 'a') {
      event.preventDefault();
      applyFitMode('auto');
    }
  };

  return (
    <div
      ref={viewerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-testid="pdf-preview-viewer"
      className="space-y-3 rounded-[24px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-success)]/35"
      aria-label={`Visionneuse PDF de ${title}`}
    >
      <div className="space-y-3 rounded-[20px] border border-[var(--border-success)] bg-[var(--bg-surface)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--c-success)]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-success)]">
              Rendu PDF.js
            </span>
            <span
              data-testid="pdf-preview-page-info"
              className="text-sm font-semibold text-[var(--c-primary)]"
            >
              {pageCount > 0 ? `Page ${pageNumber} / ${pageCount}` : 'Chargement du document'}
            </span>
            <span
              data-testid="pdf-preview-fit-label"
              className="rounded-full bg-[var(--c-primary)]/7 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-primary)]"
            >
              {fitLabel}
            </span>
            {currentSearchResult && (
              <span className="rounded-full bg-[var(--c-reward)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-reward)]">
                Résultat {activeSearchResultIndex + 1}/{searchResults.length}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="pdf-preview-fit-auto"
              onClick={() => applyFitMode('auto')}
              disabled={isBusy}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                fitMode === 'auto'
                  ? 'bg-[var(--c-primary)] text-white'
                  : 'border border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-primary)] hover:border-[var(--c-primary)]/18'
              } disabled:cursor-not-allowed disabled:opacity-45`}
            >
              Fit auto
            </button>
            <button
              type="button"
              data-testid="pdf-preview-fit-width"
              onClick={() => applyFitMode('width')}
              disabled={isBusy}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                fitMode === 'width'
                  ? 'bg-[var(--c-primary)] text-white'
                  : 'border border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-primary)] hover:border-[var(--c-primary)]/18'
              } disabled:cursor-not-allowed disabled:opacity-45`}
            >
              Fit width
            </button>
            <button
              type="button"
              data-testid="pdf-preview-fit-page"
              onClick={() => applyFitMode('page')}
              disabled={isBusy}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                fitMode === 'page'
                  ? 'bg-[var(--c-primary)] text-white'
                  : 'border border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-primary)] hover:border-[var(--c-primary)]/18'
              } disabled:cursor-not-allowed disabled:opacity-45`}
            >
              Fit page
            </button>
            <button
              type="button"
              data-testid="pdf-preview-zoom-out"
              onClick={() => applyZoomDelta(-0.15)}
              disabled={zoom <= 0.6 || isBusy}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-primary)] transition hover:border-[var(--c-primary)]/18 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Réduire le zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-14 text-center text-sm font-semibold text-[var(--c-primary)]">{zoomLabel}</span>
            <button
              type="button"
              data-testid="pdf-preview-zoom-in"
              onClick={() => applyZoomDelta(0.15)}
              disabled={zoom >= 2.2 || isBusy}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-primary)] transition hover:border-[var(--c-primary)]/18 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Augmenter le zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              data-testid="pdf-preview-prev"
              onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
              disabled={!canGoBackward || isBusy}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-primary)] transition hover:border-[var(--c-primary)]/18 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              data-testid="pdf-preview-next"
              onClick={() => setPageNumber((current) => Math.min(pageCount, current + 1))}
              disabled={!canGoForward || isBusy}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-primary)] transition hover:border-[var(--c-primary)]/18 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <form
            className="flex min-w-0 flex-1 flex-wrap items-stretch gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void runSearch(searchQuery);
            }}
          >
            <label className="relative block min-w-[240px] flex-[1_1_320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                ref={searchInputRef}
                data-testid="pdf-preview-search-input"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                type="search"
                placeholder="Rechercher un auteur, une notion, une citation..."
                className="w-full rounded-[18px] border border-[var(--border-success)] bg-[var(--bg-success)] py-3 pl-11 pr-4 text-sm text-[var(--c-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--c-success)] focus:bg-[var(--bg-surface)]"
              />
            </label>
            <button
              type="submit"
              data-testid="pdf-preview-search-submit"
              disabled={isSearching || isLoadingDocument}
              className="rounded-[18px] bg-[var(--c-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--c-primary-muted)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSearching ? 'Recherche...' : 'Rechercher'}
            </button>
            <button
              type="button"
              data-testid="pdf-preview-search-prev"
              disabled={searchResults.length < 2}
              onClick={() => goToSearchResult((activeSearchResultIndex - 1 + searchResults.length) % searchResults.length)}
              className="rounded-[18px] border border-[var(--border-success)] bg-[var(--bg-success)] px-4 py-3 text-sm font-semibold text-[var(--c-primary)] transition hover:border-[var(--c-primary)]/18 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Résultat -
            </button>
            <button
              type="button"
              data-testid="pdf-preview-search-next"
              disabled={searchResults.length < 2}
              onClick={() => goToSearchResult((activeSearchResultIndex + 1) % searchResults.length)}
              className="rounded-[18px] border border-[var(--border-success)] bg-[var(--bg-success)] px-4 py-3 text-sm font-semibold text-[var(--c-primary)] transition hover:border-[var(--c-primary)]/18 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Résultat +
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-end gap-2 xl:shrink-0">
            <button
              type="button"
              data-testid="pdf-preview-sidebar-toggle"
              onClick={toggleSidebar}
              className="inline-flex items-center gap-2 rounded-[18px] border border-[var(--border-success)] bg-[var(--bg-success)] px-4 py-3 text-sm font-semibold text-[var(--c-primary)] transition hover:border-[var(--c-primary)]/18"
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {isSidebarCollapsed ? 'Afficher miniatures' : 'Masquer miniatures'}
            </button>
            {searchQuery && (
              <button
                type="button"
                data-testid="pdf-preview-search-clear"
                onClick={() => {
                  searchRunIdRef.current += 1;
                  setSearchQuery('');
                  setSearchResults([]);
                  setActiveSearchResultIndex(0);
                  setSearchMessage('Saisissez un mot-clé pour interroger le PDF.');
                  setIsSearching(false);
                }}
                className="rounded-[18px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--c-primary)]/18 hover:text-[var(--c-primary)]"
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        {(isSearching || searchMessage || searchResults.length > 0) && (
          <div className="rounded-[18px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--c-reward)]">Recherche dans le PDF</p>
                <p
                  data-testid="pdf-preview-search-status"
                  className="mt-1 text-sm text-[var(--text-secondary)]"
                >
                  {isSearching
                    ? 'Indexation du document en cours...'
                    : searchMessage ?? 'Sélectionnez un résultat pour ouvrir la bonne page.'}
                </p>
              </div>
              {searchResults.length > 0 && (
                <span className="rounded-full bg-[var(--c-primary)]/7 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-primary)]">
                  {visibleSearchResults.length}/{searchResults.length} affichés
                </span>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {visibleSearchResults.map(({ result, index }) => {
                  const isActive = index === activeSearchResultIndex;
                  return (
                    <button
                      key={`${result.pageNumber}-${index}`}
                      type="button"
                      data-testid={`pdf-preview-search-result-${index + 1}`}
                      onClick={() => goToSearchResult(index)}
                      className={`rounded-[18px] border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-[var(--c-success)] bg-[var(--bg-success)] shadow-[0_12px_24px_rgba(15,118,110,0.10)]'
                          : 'border-[var(--border-strong)] bg-[var(--bg-surface)] hover:border-[var(--c-primary)]/18'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-sm font-semibold ${isActive ? 'text-[var(--c-success)]' : 'text-[var(--c-primary)]'}`}>
                          Page {result.pageNumber}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                          {isActive ? 'Ouverte' : 'Atteindre'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{result.snippet}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`grid gap-3 ${isSidebarCollapsed ? 'grid-cols-1' : 'lg:grid-cols-[180px_minmax(0,1fr)]'}`}>
        {!isSidebarCollapsed && (
          <aside
            data-testid="pdf-preview-sidebar"
            className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3 shadow-[0_10px_30px_rgba(23,50,77,0.06)]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--c-reward)]">Miniatures</p>
              <p className="text-xs text-[var(--text-secondary)]">{thumbnailPages.length}/{pageCount || 0}</p>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto lg:max-h-[560px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
              {pdfDocument && thumbnailPages.map((thumbnailPage) => (
                <PdfThumbnail
                  key={`${src}-${thumbnailPage}`}
                  pdfDocument={pdfDocument}
                  pageNumber={thumbnailPage}
                  isActive={thumbnailPage === pageNumber}
                  onSelect={() => setPageNumber(thumbnailPage)}
                />
              ))}
            </div>
          </aside>
        )}

        <div
          ref={containerRef}
          data-testid="pdf-preview-container"
          className="relative overflow-auto rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-page)] shadow-[0_16px_36px_rgba(23,50,77,0.10)]"
        >
          <div className="flex min-h-[420px] items-start justify-center p-4 md:min-h-[520px]">
            {!error && (
              <canvas
                ref={canvasRef}
                data-testid="pdf-preview-canvas"
                className={`max-w-full rounded-[18px] bg-[var(--bg-surface)] shadow-[0_18px_40px_rgba(23,50,77,0.16)] ${isBusy ? 'opacity-60' : 'opacity-100'}`}
                aria-label={`Aperçu PDF de ${title}`}
              />
            )}

            {isLoadingDocument && (
              <div
                data-testid="pdf-preview-loading"
                className="absolute inset-0 flex items-center justify-center bg-[var(--bg-page)]/88 backdrop-blur-[1px]"
              >
                <div className="flex items-center gap-3 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--c-primary)] shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement du PDF
                </div>
              </div>
            )}

            {!isLoadingDocument && isRenderingPage && !error && (
              <div className="absolute right-4 top-4 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)]/95 px-3 py-1.5 text-xs font-semibold text-[var(--c-primary)] shadow-sm">
                Rendu en cours
              </div>
            )}

            {error && (
              <div
                data-testid="pdf-preview-error"
                className="flex min-h-[420px] w-full flex-col items-center justify-center gap-4 px-6 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--c-accent-subtle)] text-[var(--c-accent-text)]">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <p className="text-base font-semibold text-[var(--c-primary)]">Aperçu PDF indisponible pour ce fichier.</p>
                  <p className="max-w-lg text-sm leading-7 text-[var(--text-secondary)]">
                    Le lecteur intégré n a pas pu rendre ce document. Les actions Ouvrir et Télécharger restent disponibles juste au-dessus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReloadNonce((current) => current + 1)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-success)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--c-primary)] transition hover:border-[var(--c-primary)]/18"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recharger l aperçu
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/70 px-4 py-3 text-xs leading-6 text-[var(--text-secondary)]">
        Raccourcis: <strong className="text-[var(--c-primary)]">← →</strong> pages, <strong className="text-[var(--c-primary)]">+ -</strong> zoom,
        <strong className="text-[var(--c-primary)]"> W</strong> ajuster largeur, <strong className="text-[var(--c-primary)]">P</strong> ajuster page,
        <strong className="text-[var(--c-primary)]"> A</strong> mode auto, <strong className="text-[var(--c-primary)]"> /</strong> focus recherche,
        <strong className="text-[var(--c-primary)]"> 0</strong> réinitialiser le zoom.
      </div>
    </div>
  );
}
