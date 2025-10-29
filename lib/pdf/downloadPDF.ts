// lib/pdf/downloadPdf.ts
export async function downloadPdf(inspection: any) {
  const payload = {
    object:
      inspection.object?.strasse ??
      `Objekt ${inspection.object?.objektnr ?? ""}`.trim(),
    date: inspection.date,
    status: inspection.status,
    priority: inspection.priority,
    shortage: inspection.shortage,
    measures: inspection.measures,
    address: {
      street: inspection.object?.strasse,
      city: inspection.object?.ort,
      zip: inspection.object?.plz,
    },
    photos: inspection.photos?.map((p: any) => p.url) ?? [],
  };

  const res = await fetch("/api/export-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("Fehler beim PDF Export", res.status, await res.text());
    alert("PDF konnte nicht erstellt werden");
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Besichtigung_${inspection.object?.objektnr ?? "bericht"}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
