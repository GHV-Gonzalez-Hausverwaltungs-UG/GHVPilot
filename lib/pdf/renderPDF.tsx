import React, { ComponentProps } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { BesichtigungPDF } from "@/app/pdf/BesichtigungPDF";

type BesichtigungData = ComponentProps<typeof BesichtigungPDF>["data"];

export async function generateBesichtigungPDF(data: BesichtigungData) {
  const buffer = await renderToBuffer(<BesichtigungPDF data={data} />);
  return buffer;
}
