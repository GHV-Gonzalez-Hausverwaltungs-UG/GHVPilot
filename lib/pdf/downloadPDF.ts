export async function downloadPdf(inspection: any) {
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

  const blob = await res.blob();

  // Browser-Download auslösen
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Besichtigung_${inspection.object?.objektnr ?? "bericht"}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
