import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Annotation } from "./pdf-editor-types";

function hexToRgb01(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Renders annotations (percentage-of-page geometry, top-left origin) onto the
 * real PDF via pdf-lib, flipping to pdf-lib's bottom-left origin per shape. */
export async function exportAnnotatedPdf(originalBytes: ArrayBuffer, annotations: Annotation[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(originalBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  for (const ann of annotations) {
    const page = pages[ann.page];
    if (!page) continue;
    const { width, height } = page.getSize();
    const xPt = (ann.xPct / 100) * width;
    const topYPt = (ann.yPct / 100) * height;
    const wPt = (ann.wPct / 100) * width;
    const hPt = (ann.hPct / 100) * height;
    const yPt = height - topYPt - hPt;

    if (ann.type === "text") {
      if (!ann.text.trim()) continue;
      page.drawText(ann.text, {
        x: xPt,
        y: yPt,
        size: ann.fontSize,
        font,
        color: hexToRgb01(ann.color),
        maxWidth: wPt > 0 ? wPt : undefined,
        lineHeight: ann.fontSize * 1.2,
      });
    } else if (ann.type === "rectangle") {
      page.drawRectangle({
        x: xPt,
        y: yPt,
        width: wPt,
        height: hPt,
        borderColor: hexToRgb01(ann.color),
        borderWidth: 2,
      });
    } else if (ann.type === "highlight") {
      page.drawRectangle({
        x: xPt,
        y: yPt,
        width: wPt,
        height: hPt,
        color: hexToRgb01(ann.color),
        opacity: 0.4,
      });
    } else if (ann.type === "image") {
      const isPng = ann.dataUrl.startsWith("data:image/png");
      const bytes = dataUrlToBytes(ann.dataUrl);
      const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      page.drawImage(img, { x: xPt, y: yPt, width: wPt, height: hPt });
    }
  }

  return doc.save();
}
