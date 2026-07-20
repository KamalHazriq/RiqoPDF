import { PDFDocument, PDFFont, StandardFonts, degrees, rgb } from "pdf-lib";
import JSZip from "jszip";
import { ApiError } from "./api";

/**
 * Browser-side implementations of the tools that don't need server binaries.
 * Each engine receives the same FormData the backend route would, and returns
 * a Response shaped like the backend's (content-disposition + custom headers),
 * or null to signal "fall through to the backend API".
 */

type Engine = (fd: FormData) => Promise<Response | null>;

function fileResponse(blob: Blob | Uint8Array, filename: string, extra: Record<string, string> = {}): Response {
  const body = blob instanceof Blob ? blob : new Blob([blob as BlobPart], { type: "application/pdf" });
  return new Response(body, {
    headers: { "content-disposition": `attachment; filename="${filename}"`, ...extra },
  });
}

/** Parse a 1-based spec like "1,3,5-7" into 0-based sorted unique indices. */
function parsePageIndices(spec: string, pageCount: number): number[] {
  const indices = new Set<number>();
  for (const rawPart of spec.split(",")) {
    const part = rawPart.trim();
    if (!part) continue;
    if (part.includes("-")) {
      const [a, b] = part.split("-", 2).map((s) => parseInt(s, 10));
      if (Number.isNaN(a) || Number.isNaN(b)) throw new ApiError(`Invalid page range: "${part}"`);
      const [start, end] = a <= b ? [a, b] : [b, a];
      for (let p = start; p <= end; p++) indices.add(p - 1);
    } else {
      const p = parseInt(part, 10);
      if (Number.isNaN(p)) throw new ApiError(`Invalid page number: "${part}"`);
      indices.add(p - 1);
    }
  }
  for (const idx of indices) {
    if (idx < 0 || idx >= pageCount) throw new ApiError(`Page ${idx + 1} is out of range (1-${pageCount})`);
  }
  return [...indices].sort((x, y) => x - y);
}

async function loadPdf(file: File): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
  } catch {
    throw new ApiError("Could not read this PDF. If it's password-protected, unlock it first.");
  }
}

const mergePdf: Engine = async (fd) => {
  const files = fd.getAll("files") as File[];
  if (files.length < 2) throw new ApiError("Upload at least 2 PDF files to merge");
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await loadPdf(file);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return fileResponse(await out.save(), "merged.pdf");
};

const splitPdf: Engine = async (fd) => {
  const file = fd.get("file") as File;
  const mode = (fd.get("mode") as string) || "every-page";
  const src = await loadPdf(file);
  const pageCount = src.getPageCount();

  if (mode === "pages") {
    const spec = (fd.get("pages") as string) || "";
    if (!spec) throw new ApiError("Provide a page range, e.g. '1,3,5-7'");
    const indices = parsePageIndices(spec, pageCount);
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, indices);
    pages.forEach((p) => out.addPage(p));
    return fileResponse(await out.save(), "split.pdf");
  }

  const zip = new JSZip();
  for (let i = 0; i < pageCount; i++) {
    const out = await PDFDocument.create();
    const [page] = await out.copyPages(src, [i]);
    out.addPage(page);
    zip.file(`page_${i + 1}.pdf`, await out.save());
  }
  const blob = await zip.generateAsync({ type: "blob" });
  return fileResponse(blob, "split_pages.zip");
};

const rotatePdf: Engine = async (fd) => {
  const file = fd.get("file") as File;
  const deg = parseInt((fd.get("degrees") as string) || "90", 10);
  if (deg % 90 !== 0) throw new ApiError("degrees must be a multiple of 90");
  const spec = (fd.get("pages") as string) || "";
  const doc = await loadPdf(file);
  const targets = spec ? new Set(parsePageIndices(spec, doc.getPageCount())) : null;
  doc.getPages().forEach((page, i) => {
    if (targets && !targets.has(i)) return;
    page.setRotation(degrees(((page.getRotation().angle + deg) % 360 + 360) % 360));
  });
  return fileResponse(await doc.save(), "rotated.pdf");
};

const organizePdf: Engine = async (fd) => {
  const file = fd.get("file") as File;
  const order = (fd.get("order") as string) || "";
  const deleteSpec = (fd.get("delete_pages") as string) || "";
  const src = await loadPdf(file);
  const pageCount = src.getPageCount();

  let keep: number[];
  if (order) {
    keep = parsePageIndices(order, pageCount);
    if (keep.length !== pageCount) throw new ApiError("order must include every page exactly once");
  } else {
    const toDelete = new Set(deleteSpec ? parsePageIndices(deleteSpec, pageCount) : []);
    if (toDelete.size === pageCount) throw new ApiError("Cannot delete every page");
    keep = src.getPageIndices().filter((i) => !toDelete.has(i));
  }

  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, keep);
  pages.forEach((p) => out.addPage(p));
  return fileResponse(await out.save(), "organized.pdf");
};

const jpgToPdf: Engine = async (fd) => {
  const files = fd.getAll("files") as File[];
  if (!files.length) throw new ApiError("Upload at least one image");
  const out = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    const img = isPng ? await out.embedPng(bytes) : await out.embedJpg(bytes);
    const page = out.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return fileResponse(await out.save(), "converted.pdf");
};

const cropPdf: Engine = async (fd) => {
  const file = fd.get("file") as File;
  const top = parseFloat((fd.get("top_percent") as string) || "0");
  const bottom = parseFloat((fd.get("bottom_percent") as string) || "0");
  const left = parseFloat((fd.get("left_percent") as string) || "0");
  const right = parseFloat((fd.get("right_percent") as string) || "0");
  for (const v of [top, bottom, left, right]) {
    if (v < 0 || v >= 50) throw new ApiError("Each margin must be between 0 and 50 percent");
  }
  if (!(top || bottom || left || right)) throw new ApiError("Set at least one margin to crop");
  const spec = (fd.get("pages") as string) || "";
  const doc = await loadPdf(file);
  const targets = spec ? new Set(parsePageIndices(spec, doc.getPageCount())) : null;

  doc.getPages().forEach((page, i) => {
    if (targets && !targets.has(i)) return;
    const { x, y, width, height } = page.getMediaBox();
    // pdf-lib's origin is bottom-left, so the top trim comes off (y + height)
    page.setCropBox(
      x + (width * left) / 100,
      y + (height * bottom) / 100,
      width * (1 - (left + right) / 100),
      height * (1 - (top + bottom) / 100),
    );
  });
  return fileResponse(await doc.save(), "cropped.pdf");
};

const MARGIN = 28;

function textX(align: string, pageWidth: number, textWidth: number): number {
  if (align === "left") return MARGIN;
  if (align === "right") return pageWidth - MARGIN - textWidth;
  return (pageWidth - textWidth) / 2;
}

const pageNumbers: Engine = async (fd) => {
  const file = fd.get("file") as File;
  const position = (fd.get("position") as string) || "bottom-center";
  const startAt = parseInt((fd.get("start_at") as string) || "1", 10);
  const template = (fd.get("template") as string) || "{n}";
  const fontSize = parseInt((fd.get("font_size") as string) || "11", 10);
  if (fontSize < 6 || fontSize > 36) throw new ApiError("font_size must be between 6 and 36");

  const doc = await loadPdf(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const total = doc.getPageCount();
  const [vert, horiz] = position.split("-");

  doc.getPages().forEach((page, i) => {
    const label = template.replaceAll("{n}", String(startAt + i)).replaceAll("{total}", String(total));
    const { width, height } = page.getSize();
    const tw = font.widthOfTextAtSize(label, fontSize);
    const y = vert === "top" ? height - MARGIN - fontSize : MARGIN;
    page.drawText(label, {
      x: textX(horiz, width, tw),
      y,
      size: fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  });
  return fileResponse(await doc.save(), "numbered.pdf");
};

function drawWatermarkText(
  page: ReturnType<PDFDocument["getPages"]>[number],
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size: number,
  opacity: number,
  rotation: number,
) {
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: rgb(0.5, 0.5, 0.5),
    opacity,
    rotate: degrees(rotation),
  });
}

const watermark: Engine = async (fd) => {
  if ((fd.get("watermark_type") as string) !== "text") return null; // image watermark -> backend
  const file = fd.get("file") as File;
  const text = ((fd.get("text") as string) || "").trim();
  if (!text) throw new ApiError("Provide watermark text");
  const opacity = parseFloat((fd.get("opacity") as string) || "0.4");
  const rotation = parseInt((fd.get("rotation") as string) || "0", 10);
  const tile = (fd.get("tile") as string) === "true";
  const position = (fd.get("position") as string) || "center";
  if (opacity <= 0 || opacity > 1) throw new ApiError("opacity must be between 0 and 1");
  if (rotation % 90 !== 0) throw new ApiError("rotation must be a multiple of 90");

  const doc = await loadPdf(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    if (tile) {
      for (let gx = 0; gx < width; gx += 220) {
        for (let gy = 0; gy < height; gy += 80) {
          drawWatermarkText(page, font, text, gx, gy, 20, opacity, rotation);
        }
      }
    } else {
      const size = 28;
      const tw = font.widthOfTextAtSize(text, size);
      const spots: Record<string, [number, number]> = {
        "center": [(width - tw) / 2, height / 2],
        "top-left": [36, height - 36 - size],
        "top-right": [width - 36 - tw, height - 36 - size],
        "bottom-left": [36, 36],
        "bottom-right": [width - 36 - tw, 36],
      };
      const [x, y] = spots[position] ?? spots["center"];
      drawWatermarkText(page, font, text, x, y, size, opacity, rotation);
    }
  }
  return fileResponse(await doc.save(), "watermarked.pdf");
};

export const clientEngines: Record<string, Engine> = {
  "merge-pdf": mergePdf,
  "split-pdf": splitPdf,
  "rotate-pdf": rotatePdf,
  "organize-pdf": organizePdf,
  "jpg-to-pdf": jpgToPdf,
  "crop-pdf": cropPdf,
  "page-numbers": pageNumbers,
  "watermark": watermark,
};
