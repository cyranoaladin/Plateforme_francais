import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { type CopieRecord, type EpreuveRecord } from '@/lib/epreuves/types';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 18, marginBottom: 8 },
  subtitle: { fontSize: 12, marginBottom: 12 },
  section: { marginBottom: 10 },
  rubricRow: { marginBottom: 6 },
});

export function CorrectionReportPdf({
  copie,
  epreuve,
}: {
  copie: CopieRecord;
  epreuve: EpreuveRecord;
}) {
  const correction = copie.correction;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Rapport de correction EAF</Text>
        <Text style={styles.subtitle}>Sujet: {epreuve.sujet}</Text>

        <View style={styles.section}>
          <Text>Note: {correction?.note ?? 0}/20</Text>
          <Text>Mention: {correction?.mention ?? 'Non évalué'}</Text>
        </View>

        <View style={styles.section}>
          <Text>Bilan global</Text>
          <Text>{correction?.bilan?.global ?? 'N/A'}</Text>
        </View>

        <View style={styles.section}>
          <Text>Rubriques</Text>
          {Array.isArray(correction?.rubriques) ? correction.rubriques.map((item) => (
            <View style={styles.rubricRow} key={`${item.titre ?? 'item'}-${item.max ?? 0}`}>
              <Text>
                {item.titre ?? 'Rubrique'}: {item.note ?? 0}/{item.max ?? 0}
              </Text>
              <Text>{item.appreciation ?? ''}</Text>
            </View>
          )) : null}
        </View>

        <View style={styles.section}>
          <Text>Conseil final</Text>
          <Text>{correction?.conseil_final ?? ''}</Text>
        </View>
      </Page>
    </Document>
  );
}
