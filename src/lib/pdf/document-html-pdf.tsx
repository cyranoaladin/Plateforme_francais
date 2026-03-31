import React from 'react';
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    color: '#1f2937',
    lineHeight: 1.45,
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
    color: '#0f172a',
  },
  section: {
    marginBottom: 10,
  },
  paragraph: {
    marginBottom: 6,
  },
});

function stripHtmlToText(html: string): string[] {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<\/(p|div|section|h1|h2|h3|li|tr)>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function HtmlDocumentPdf({ title, html }: { title: string; html: string }) {
  const lines = stripHtmlToText(html);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>{title}</Text>
        </View>
        {lines.map((line, index) => (
          <View key={`${index}-${line.slice(0, 16)}`} style={styles.section}>
            <Text style={styles.paragraph}>{line}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function renderHtmlDocumentPdf(title: string, html: string): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<HtmlDocumentPdf title={title} html={html} />);
  return new Uint8Array(buffer);
}
