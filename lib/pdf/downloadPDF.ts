export async function downloadPdf(inspection: any) {
  try {
    const res = await fetch("/api/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        object:
          inspection.object?.strasse ?? `Objekt ${inspection.object?.objektnr}`,
        date: inspection.date,
        priority: inspection.priority,
        status: inspection.status,
        shortage: inspection.shortage,
        measures: inspection.measures,
        photos: inspection.photos?.map((p: any) => p.url) ?? [],
      }),
    });
    console.log(res.headers.get("content-type"));
    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Server-Fehler:", text);
      alert(`Fehler beim Generieren des PDFs (${res.status})`);
      return;
    }

    const blob = await res.blob();
    if (blob.size < 100) {
      console.error("Leeres PDF empfangen");
      alert("Das PDF scheint leer zu sein – bitte erneut versuchen.");
      return;
    }

    // ✅ Cross-Browser-sicherer Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Besichtigung_${
      inspection.object?.objektnr ?? "bericht"
    }.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("✅ PDF erfolgreich heruntergeladen");
  } catch (error) {
    console.error("❌ PDF-Download fehlgeschlagen:", error);
    alert("Fehler beim PDF-Download – siehe Konsole für Details.");
  }
}
