import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EcritCopyUploader } from '@/app/atelier-ecrit/components/EcritCopyUploader';

describe('EcritCopyUploader', () => {
  it('affiche la carte de progression pendant le traitement', () => {
    const html = renderToString(
      createElement(EcritCopyUploader, {
        epreuve: {
          epreuveId: 'epreuve-1',
          sujet: 'Sujet test',
          texte: '',
          consignes: 'Consignes',
          bareme: {},
          generatedAt: '',
        },
        selectedFile: null,
        previewUrl: null,
        uploadProgress: 0,
        isUploading: false,
        pollingStatus: 'processing',
        processingLabel: 'Analyse des points de méthode et de contenu…',
        copieLink: null,
        tutorHref: '/tuteur',
        onSelectFile: () => {},
        onTriggerFileDialog: () => {},
        onTriggerCameraDialog: () => {},
        onUpload: async () => {},
      }),
    );

    expect(html).toContain('Ta copie est entre de bonnes mains');
    expect(html).toContain('Analyse des points de méthode et de contenu');
  });
});
