// app/api/export-pdf/route.ts
import { generateBesichtigungPDF } from "@/lib/pdf/renderPDF";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. PDF als Buffer erzeugen
    const pdfBuffer = await generateBesichtigungPDF(data);

    // 2. In ArrayBuffer / Uint8Array verwandeln,
    //    damit die Web-Response-Typen happy sind
    const uint8 = new Uint8Array(pdfBuffer); // pdfBuffer ist Node Buffer, Uint8Array ist web-kompatibel

    return new Response(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        // inline = direkt im Browser öffnen
        // attachment = Download-Dialog
        "Content-Disposition": `attachment; filename="besichtigung_${
          data.object ?? "bericht"
        }.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Fehler:", error);
    return new Response(JSON.stringify({ error: "Fehler beim PDF-Export" }), {
      status: 500,
    });
  }
}
