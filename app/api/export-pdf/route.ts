import { NextRequest, NextResponse } from "next/server";
import { BesichtigungPDF, BesichtigungData } from "@/lib/pdf/BesichtigungPDF";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Body holen
    const data = (await req.json()) as BesichtigungData;

    // 2. Deine React-Komponente -> HTML-String
    const html =
      "<!doctype html>" +
      renderToStaticMarkup(
        React.createElement(
          "html",
          null,
          React.createElement(
            "head",
            null,
            React.createElement("meta", { charSet: "utf-8" }),
            React.createElement("title", null, "Besichtigung"),
            React.createElement("meta", {
              name: "viewport",
              content: "width=device-width, initial-scale=1.0",
            })
            // hier könntest du optional Inline-CSS dazufügen
          ),
          React.createElement(
            "body",
            { style: { backgroundColor: "#fff" } },
            React.createElement(BesichtigungPDF, { data })
          )
        )
      );

    // 3. Headless Chrome vorbereiten (Vercel-kompatibel)
    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1080, height: 1920 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    // 4. HTML injizieren
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // 5. PDF erzeugen
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
    });

    await browser.close();

    // 6. Antwort als PDF
    // create a new ArrayBuffer and copy the PDF bytes into it so TypeScript treats it as ArrayBuffer (not SharedArrayBuffer)
    const arrayBuffer = new ArrayBuffer(pdfBuffer.byteLength);
    new Uint8Array(arrayBuffer).set(new Uint8Array(pdfBuffer));

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="besichtigung_${
          data.object ?? "bericht"
        }.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PDF Fehler:", err);
    return NextResponse.json(
      { error: "Fehler beim PDF-Export" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, msg: "PDF API bereit ✅" });
}
