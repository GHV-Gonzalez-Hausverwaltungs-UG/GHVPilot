// ✅ app/api/export-pdf/route.ts
import { NextResponse } from "next/server";
import { generateBesichtigungPDF } from "@/lib/pdf/renderPDF";

// 👇 diese Zeilen MÜSSEN ganz oben stehen
export const runtime = "nodejs"; // zwingt Serverless statt Edge
export const dynamic = "force-dynamic"; // kein Caching
export const preferredRegion = "iad1"; // (optional) deine bevorzugte Region

export async function GET() {
  // einfacher Sanity Check für curl/browser
  return NextResponse.json({ ok: true, msg: "PDF export API online ✅" });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const pdfBuffer = await generateBesichtigungPDF(data);
    const uint8 = new Uint8Array(pdfBuffer);

    // 🔥 erzwinge MIME-Type und Datei-Download
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="besichtigung_${
          data.object ?? "bericht"
        }.pdf"`,
        "Cache-Control": "no-store", // kein Edge-Cache
      },
    });
  } catch (error) {
    console.error("❌ PDF Fehler:", error);
    return NextResponse.json(
      { error: "Fehler beim PDF-Export" },
      { status: 500 }
    );
  }
}
