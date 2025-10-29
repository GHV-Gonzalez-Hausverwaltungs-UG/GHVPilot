export async function downloadPdf(inspection: any) {
  // 👇 sichere absolute URL ermitteln
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : window.location.origin;

  console.log("POSTing to:", `${baseUrl}/api/export-pdf`);
  const res = await fetch(`${baseUrl}/api/export-pdf`, {
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

  if (!res.ok) {
    console.error("Server-Fehler:", res.status, await res.text());
    alert(`Fehler beim PDF-Export (${res.status})`);
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
