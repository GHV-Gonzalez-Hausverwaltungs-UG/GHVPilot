// app/api/export-pdf/route.ts
export const runtime = "nodejs";

import { generateBesichtigungPDF } from "@/lib/pdf/renderPDF";

export async function GET() {
  return new Response("PDF export API online", { status: 200 });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const pdfBuffer = await generateBesichtigungPDF(data);
    const uint8 = new Uint8Array(pdfBuffer);

    return new Response(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
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
