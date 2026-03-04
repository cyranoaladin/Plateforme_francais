import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

export type CarnetEntryPdf = {
  oeuvre: string;
  type: 'citation' | 'note' | 'reaction' | 'resume' | 'lien_culturel';
  contenu: string;
  page?: string;
  tags?: string[];
  createdAt: string;
};

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 18, marginBottom: 6, fontWeight: 700 },
  subtitle: { fontSize: 10, color: '#555', marginBottom: 14 },
  card: { border: '1 solid #d8d8d8', borderRadius: 6, padding: 8, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  meta: { fontSize: 9, color: '#666' },
  body: { fontSize: 10, lineHeight: 1.3 },
});

export function CarnetExportPdf({ entries, studentName }: { entries: CarnetEntryPdf[]; studentName: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Carnet de lecture — EAF</Text>
        <Text style={styles.subtitle}>{studentName} · {new Date().toLocaleDateString('fr-FR')}</Text>

        {entries.map((entry, idx) => (
          <View key={`${entry.oeuvre}-${idx}`} style={styles.card}>
            <View style={styles.row}>
              <Text>{entry.oeuvre}</Text>
              <Text style={styles.meta}>{new Date(entry.createdAt).toLocaleDateString('fr-FR')}</Text>
            </View>
            <Text style={styles.meta}>Type: {entry.type}{entry.page ? ` · p.${entry.page}` : ''}{entry.tags?.length ? ` · ${entry.tags.join(', ')}` : ''}</Text>
            <Text style={styles.body}>{entry.contenu}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
