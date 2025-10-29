// app/api/combinePdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabaseclient";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToStream,
} from "@react-pdf/renderer";

// --- Styles ----------------------------------------------------
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#fafafa",
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#111",
  },
  header: {
    borderBottom: "2pt solid #0070f3",
    paddingBottom: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0070f3",
  },
  deckblatt: {
    fontSize: 48,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    color: "#0070f3",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    color: "#444",
  },
  section: {
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",

    justifyContent: "space-between",
  },
  label: {
    fontWeight: "bold",
    marginBottom: 2,
    color: "#222",
  },
  text: {
    marginBottom: 6,
    lineHeight: 1.4,
  },
  infoBox: {
    border: "1pt solid #ddd",
    borderRadius: 4,
    padding: 10,
    marginBottom: 6,
    backgroundColor: "#fff",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  photo: {
    width: "48%",
    height: 160,
    objectFit: "cover",
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#888",
    borderTop: "1pt solid #ddd",
    paddingTop: 8,
    textAlign: "center",
  },
});

// --- PDF-Komponente --------------------------------------------
const MultiInspectionPDF = ({ inspections }: { inspections: any[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.deckblatt}>Besichtigungsbericht</Text>
      </View>
    </Page>
    {inspections.map((inspection, i) => (
      <Page key={i} size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            Objekt: {inspection.object?.strasse ?? "—"},{" "}
            {inspection.object?.plz ?? ""} {inspection.object?.ort ?? "—"}
          </Text>
        </View>

        {/* BASIS-INFORMATIONEN */}
        <View style={styles.row}>
          <View style={styles.section}>
            <Text style={styles.label}>Datum:</Text>
            <Text style={styles.text}>
              {inspection.date
                ? new Date(inspection.date).toLocaleDateString("de-DE")
                : "—"}
            </Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Uhrzeit:</Text>
            <Text style={styles.text}>{inspection.time ?? "—"}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Dringlichkeit:</Text>
            <Text style={styles.text}>{inspection.priority ?? "—"}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.text}>{inspection.status ?? "—"}</Text>
          </View>
        </View>

        {/* DETAILS */}
        {inspection.floor && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Etage:</Text>
            <Text style={styles.text}>{inspection.floor}</Text>
          </View>
        )}

        {inspection.entrance && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Eingang:</Text>
            <Text style={styles.text}>{inspection.entrance}</Text>
          </View>
        )}

        {/* MANGELBESCHREIBUNG */}
        {inspection.shortage && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Mangelbeschreibung:</Text>
            <Text style={styles.text}>{inspection.shortage}</Text>
          </View>
        )}

        {/* MASSNAHMEN */}
        {inspection.measures && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Vorgeschlagene Maßnahmen:</Text>
            <Text style={styles.text}>{inspection.measures}</Text>
          </View>
        )}

        {/* VERANTWORTLICHKEIT */}
        {inspection.responsibility && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Zuständig:</Text>
            <Text style={styles.text}>{inspection.responsibility}</Text>
          </View>
        )}

        {/* INSPEKTOR */}
        {inspection.inspector && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Besichtigt von:</Text>
            <Text style={styles.text}>{inspection.inspector}</Text>
          </View>
        )}

        {/* ANMERKUNGEN */}
        {inspection.notes && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Zusätzliche Anmerkungen:</Text>
            <Text style={styles.text}>{inspection.notes}</Text>
          </View>
        )}

        {/* FOTOS */}
        {inspection.photos && inspection.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Fotodokumentation:</Text>
            <View style={styles.photoGrid}>
              {inspection.photos
                .filter(
                  (p: any) =>
                    p && typeof p.url === "string" && p.url.trim() !== ""
                )
                .map((photo: any, i: number) => (
                  <Image
                    key={i}
                    src={
                      photo.url || "https://placehold.co/400x300?text=Fehler"
                    }
                    style={styles.photo}
                  />
                ))}
            </View>
          </View>
        )}
      </Page>
    ))}
  </Document>
);

// --- API Route -------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json({ error: "Missing ?ids=" }, { status: 400 });
  }

  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ error: "No valid IDs" }, { status: 400 });
  }

  // 🔹 Daten abrufen
  const { data, error } = await supabase
    .from("inspections")
    .select(
      `
        id,
        date,
        time,
        priority,
        status,
        shortage,
        object:objects!inspections_object_id_fkey (
          objektnr,
          strasse,
          ort,
          plz
        ),
        photos:photos (
          id,
          url,
          description
        )
      `
    )
    .in("id", ids);

  if (error) {
    console.error("Fehler beim Laden:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "Keine Daten gefunden" },
      { status: 404 }
    );
  }

  // 🔹 PDF rendern
  const stream = await renderToStream(
    <MultiInspectionPDF inspections={data} />
  );

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="besichtigungen_${Date.now()}.pdf"`,
    },
  });
}
