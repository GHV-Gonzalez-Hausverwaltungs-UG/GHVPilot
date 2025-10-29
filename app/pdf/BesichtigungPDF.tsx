import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// ✅ Styling ähnlich Tailwind – aber PDF-kompatibel
const styles = StyleSheet.create({
  page: { backgroundColor: "#f5f5f5", padding: 30, fontSize: 12 },
  section: { marginBottom: 10 },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 8,
  },
  label: { fontWeight: "bold" },
  text: { marginBottom: 4 },
  image: { width: 200, height: 120, marginVertical: 6, objectFit: "cover" },
});

type BesichtigungData = {
  object?: string;
  date?: string;
  priority?: string;
  status?: string;
  shortage?: string;
  measures?: string;
  photos?: string[];
};

export const BesichtigungPDF = ({ data }: { data: BesichtigungData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.header}>Besichtigung – {data.object}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Datum:</Text>
        <Text style={styles.text}>{data.date}</Text>

        <Text style={styles.label}>Dringlichkeit:</Text>
        <Text style={styles.text}>{data.priority}</Text>

        <Text style={styles.label}>Status:</Text>
        <Text style={styles.text}>{data.status}</Text>

        <Text style={styles.label}>Mangel:</Text>
        <Text style={styles.text}>{data.shortage}</Text>

        <Text style={styles.label}>Maßnahmen:</Text>
        <Text style={styles.text}>{data.measures}</Text>
      </View>

      {data.photos?.length ? (
        <View style={styles.section}>
          <Text style={styles.label}>Fotos:</Text>
          {data.photos.map((url: string, i: number) => (
            <Image key={i} src={url} style={styles.image} />
          ))}
        </View>
      ) : null}
    </Page>
  </Document>
);
