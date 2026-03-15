import { uiSidebarCopy } from './ui-sidebar';

type PdfFitMode = 'auto' | 'width' | 'page';

export const uiCopy = {
  sidebar: uiSidebarCopy,
  pdfPreview: {
    emptyPageText: 'Page sans contenu textuel exploitable.',
    errors: {
      canvasUnavailable: 'Canvas 2D indisponible.',
      documentUnavailable: 'Aperçu PDF indisponible.',
      renderFailed: 'Rendu PDF impossible.',
    },
    aria: {
      viewer: (title: string) => `Visionneuse PDF de ${title}`,
      goToPage: (pageNumber: number) => `Aller à la page ${pageNumber}`,
      canvas: (title: string) => `Aperçu PDF de ${title}`,
    },
    toolbar: {
      rendererBadge: 'Rendu PDF.js',
      loadingDocument: 'Chargement du document',
      fitAuto: 'Fit auto',
      fitWidth: 'Fit width',
      fitPage: 'Fit page',
      zoomOutAria: 'Réduire le zoom',
      zoomInAria: 'Augmenter le zoom',
      prevPageAria: 'Page précédente',
      nextPageAria: 'Page suivante',
      buildPageInfo: (pageNumber: number, pageCount: number) =>
        (pageCount > 0 ? `Page ${pageNumber} / ${pageCount}` : 'Chargement du document'),
      buildFitLabel: (fitMode: PdfFitMode, resolvedAutoFitMode: 'width' | 'page') => {
        if (fitMode === 'auto') {
          return `Auto (${resolvedAutoFitMode === 'page' ? 'page' : 'largeur'})`;
        }

        return fitMode === 'page' ? 'Ajuster page' : 'Ajuster largeur';
      },
      buildResultBadge: (current: number, total: number) => `Résultat ${current}/${total}`,
    },
    search: {
      documentUnavailable: 'Document encore indisponible pour la recherche.',
      prompt: 'Saisissez un mot-clé pour interroger le PDF.',
      noResults: 'Aucun résultat dans ce document.',
      temporaryUnavailable: 'Recherche temporairement indisponible sur ce document.',
      placeholder: 'Rechercher un auteur, une notion, une citation...',
      submitLoading: 'Recherche...',
      submitIdle: 'Rechercher',
      previousResult: 'Résultat -',
      nextResult: 'Résultat +',
      eyebrow: 'Recherche dans le PDF',
      indexing: 'Indexation du document en cours...',
      defaultStatus: 'Sélectionnez un résultat pour ouvrir la bonne page.',
      clear: 'Effacer',
      visibleSuffix: 'affichés',
      opened: 'Ouverte',
      reach: 'Atteindre',
      buildCount: (count: number) =>
        `${count} résultat${count > 1 ? 's' : ''}${count === 24 ? ' (limite affichée)' : ''}.`,
      buildVisibleCount: (visibleCount: number, totalCount: number) => `${visibleCount}/${totalCount} affichés`,
      buildPageLabel: (pageNumber: number) => `Page ${pageNumber}`,
    },
    sidebar: {
      show: 'Afficher miniatures',
      hide: 'Masquer miniatures',
      eyebrow: 'Miniatures',
    },
    states: {
      loading: 'Chargement du PDF',
      rendering: 'Rendu en cours',
      previewUnavailableTitle: 'Aperçu PDF indisponible pour ce fichier.',
      previewUnavailableBody:
        'Le lecteur intégré n’a pas pu rendre ce document. Les actions Ouvrir et Télécharger restent disponibles juste au-dessus.',
      reloadCta: "Recharger l’aperçu",
    },
    shortcuts: {
      eyebrow: 'Raccourcis:',
      pages: 'pages',
      zoom: 'zoom',
      adjustWidth: 'ajuster largeur',
      adjustPage: 'ajuster page',
      autoMode: 'mode auto',
      focusSearch: 'focus recherche',
      resetZoom: 'réinitialiser le zoom',
    },
  },
} as const;
