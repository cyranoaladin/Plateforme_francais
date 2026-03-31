import { describe, expect, it } from 'vitest';

import { renderHtmlDocumentPdf } from '@/lib/pdf/document-html-pdf';

describe('renderHtmlDocumentPdf', () => {
  it('renders a non-empty PDF buffer from simple HTML', async () => {
    const result = await renderHtmlDocumentPdf('Test', '<p>Hello</p><p>World</p>');

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.byteLength).toBeGreaterThan(0);
  });
});
