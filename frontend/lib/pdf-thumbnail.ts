let workerConfigured = false;

async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  if (!workerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    workerConfigured = true;
  }
  return pdfjsLib;
}

const cache = new WeakMap<File, Promise<string | null>>();

/** Renders a PDF's first page to a small data-URL thumbnail, cached per File instance. */
export function getPdfThumbnail(file: File): Promise<string | null> {
  const cached = cache.get(file);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const pdfjsLib = await loadPdfjs();
      const bytes = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
      const page = await doc.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const scale = 96 / Math.max(viewport.width, viewport.height);
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
      const url = canvas.toDataURL("image/png");
      doc.destroy();
      return url;
    } catch (err) {
      console.error("[pdf-thumbnail]", err);
      return null;
    }
  })();

  cache.set(file, promise);
  return promise;
}
