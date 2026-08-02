"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Highlighter,
  ImagePlus,
  MousePointer2,
  Square,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/api";
import { exportAnnotatedPdf } from "@/lib/pdf-editor-export";
import {
  DEFAULT_HIGHLIGHT_COLOR,
  DEFAULT_SHAPE_COLOR,
  DEFAULT_TEXT_COLOR,
  type Annotation,
  type AnnotationType,
} from "@/lib/pdf-editor-types";

const RENDER_WIDTH = 900; // intrinsic canvas pixels; CSS scales it down responsively
let nextId = 1;

type Tool = "select" | AnnotationType;

interface DragRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function PdfEditor() {
  const [fileBytes, setFileBytes] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState("");
  const [pdfDoc, setPdfDoc] = useState<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [drawingRect, setDrawingRect] = useState<DragRect | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dragState = useRef<{ id: string; offsetXPct: number; offsetYPct: number } | null>(null);
  const drawStart = useRef<{ x: number; y: number } | null>(null);

  async function handlePickFile(file: File) {
    setError(null);
    const bytes = await file.arrayBuffer();
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      setFileBytes(bytes);
      setFileName(file.name);
      setPdfDoc(doc);
      setPageIndex(0);
      setAnnotations([]);
      setSelectedId(null);
    } catch {
      setError("Could not open this PDF. Try a different file.");
    }
  }

  // Render the current page to the canvas whenever the page or document changes.
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      const page = await pdfDoc.getPage(pageIndex + 1);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = RENDER_WIDTH / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      await page.render({ canvasContext: ctx, viewport }).promise;
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageIndex]);

  function pointFromEvent(e: ReactPointerEvent): { xPct: number; yPct: number } {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      xPct: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)),
      yPct: Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  }

  function addAnnotation(ann: Annotation) {
    setAnnotations((prev) => [...prev, ann]);
    setSelectedId(ann.id);
  }

  function updateAnnotation(id: string, patch: Partial<Annotation>) {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? ({ ...a, ...patch } as Annotation) : a)));
  }

  function deleteSelected() {
    if (!selectedId) return;
    setAnnotations((prev) => prev.filter((a) => a.id !== selectedId));
    setSelectedId(null);
  }

  function handleOverlayPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (tool === "select") {
      setSelectedId(null);
      return;
    }
    if (tool === "text") {
      const { xPct, yPct } = pointFromEvent(e);
      addAnnotation({
        id: `a${nextId++}`,
        type: "text",
        page: pageIndex,
        xPct,
        yPct,
        wPct: 30,
        hPct: 4,
        text: "New text",
        fontSize: 16,
        color: DEFAULT_TEXT_COLOR,
      });
      setTool("select");
      return;
    }
    if (tool === "rectangle" || tool === "highlight") {
      const { xPct, yPct } = pointFromEvent(e);
      drawStart.current = { x: xPct, y: yPct };
      setDrawingRect({ x0: xPct, y0: yPct, x1: xPct, y1: yPct });
    }
  }

  function handleOverlayPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragState.current) {
      const { xPct, yPct } = pointFromEvent(e);
      const { id, offsetXPct, offsetYPct } = dragState.current;
      updateAnnotation(id, {
        xPct: Math.max(0, Math.min(100, xPct - offsetXPct)),
        yPct: Math.max(0, Math.min(100, yPct - offsetYPct)),
      });
      return;
    }
    if (drawStart.current) {
      const { xPct, yPct } = pointFromEvent(e);
      setDrawingRect({ x0: drawStart.current.x, y0: drawStart.current.y, x1: xPct, y1: yPct });
    }
  }

  function handleOverlayPointerUp() {
    if (dragState.current) {
      dragState.current = null;
      return;
    }
    if (drawStart.current && drawingRect) {
      const x = Math.min(drawingRect.x0, drawingRect.x1);
      const y = Math.min(drawingRect.y0, drawingRect.y1);
      const w = Math.abs(drawingRect.x1 - drawingRect.x0);
      const h = Math.abs(drawingRect.y1 - drawingRect.y0);
      if (w > 1 && h > 1) {
        addAnnotation({
          id: `a${nextId++}`,
          type: tool === "highlight" ? "highlight" : "rectangle",
          page: pageIndex,
          xPct: x,
          yPct: y,
          wPct: w,
          hPct: h,
          color: tool === "highlight" ? DEFAULT_HIGHLIGHT_COLOR : DEFAULT_SHAPE_COLOR,
        });
      }
      setTool("select");
    }
    drawStart.current = null;
    setDrawingRect(null);
  }

  function handleAnnotationPointerDown(e: ReactPointerEvent, ann: Annotation) {
    e.stopPropagation();
    setSelectedId(ann.id);
    const { xPct, yPct } = pointFromEvent(e);
    dragState.current = { id: ann.id, offsetXPct: xPct - ann.xPct, offsetYPct: yPct - ann.yPct };
  }

  function handleImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      addAnnotation({
        id: `a${nextId++}`,
        type: "image",
        page: pageIndex,
        xPct: 35,
        yPct: 35,
        wPct: 30,
        hPct: 20,
        dataUrl: reader.result as string,
      });
      setTool("select");
    };
    reader.readAsDataURL(file);
  }

  async function handleExport() {
    if (!fileBytes) return;
    setExporting(true);
    setError(null);
    try {
      const bytes = await exportAnnotatedPdf(fileBytes, annotations);
      downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), fileName.replace(/\.pdf$/i, "") + "-edited.pdf");
    } catch {
      setError("Could not export the edited PDF. Try removing the most recent annotation and exporting again.");
    } finally {
      setExporting(false);
    }
  }

  const selected = annotations.find((a) => a.id === selectedId) ?? null;
  const pageAnnotations = annotations.filter((a) => a.page === pageIndex);

  if (!pdfDoc) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full max-w-md cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 p-10 text-center hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
        >
          <Upload className="text-neutral-400" size={28} />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Click to open a PDF to edit</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handlePickFile(e.target.files[0])}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ToolButton icon={MousePointer2} label="Select" active={tool === "select"} onClick={() => setTool("select")} />
          <ToolButton icon={Type} label="Text" active={tool === "text"} onClick={() => setTool("text")} />
          <ToolButton icon={Highlighter} label="Highlight" active={tool === "highlight"} onClick={() => setTool("highlight")} />
          <ToolButton icon={Square} label="Rectangle" active={tool === "rectangle"} onClick={() => setTool("rectangle")} />
          <ToolButton
            icon={ImagePlus}
            label="Image"
            active={tool === "image"}
            onClick={() => imageInputRef.current?.click()}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
          />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={pageIndex === 0}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm text-neutral-500">
              Page {pageIndex + 1} of {pdfDoc.numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((p) => Math.min(pdfDoc.numPages - 1, p + 1))}
              disabled={pageIndex === pdfDoc.numPages - 1}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="relative w-full select-none overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <canvas ref={canvasRef} className="block w-full" />
          <div
            ref={overlayRef}
            className="absolute inset-0"
            style={{ cursor: tool === "select" ? "default" : "crosshair" }}
            onPointerDown={handleOverlayPointerDown}
            onPointerMove={handleOverlayPointerMove}
            onPointerUp={handleOverlayPointerUp}
          >
            {pageAnnotations.map((ann) => (
              <AnnotationView
                key={ann.id}
                ann={ann}
                selected={ann.id === selectedId}
                onPointerDown={(e) => handleAnnotationPointerDown(e, ann)}
              />
            ))}
            {drawingRect && (
              <div
                className="pointer-events-none absolute border-2 border-dashed border-neutral-500"
                style={{
                  left: `${Math.min(drawingRect.x0, drawingRect.x1)}%`,
                  top: `${Math.min(drawingRect.y0, drawingRect.y1)}%`,
                  width: `${Math.abs(drawingRect.x1 - drawingRect.x0)}%`,
                  height: `${Math.abs(drawingRect.y1 - drawingRect.y0)}%`,
                }}
              />
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button size="lg" onClick={handleExport} disabled={exporting}>
          <Download size={16} />
          {exporting ? "Exporting…" : "Download edited PDF"}
        </Button>
      </div>

      <div className="w-full shrink-0 lg:w-64">
        {selected ? (
          <AnnotationProperties
            annotation={selected}
            onChange={(patch) => updateAnnotation(selected.id, patch)}
            onDelete={deleteSelected}
          />
        ) : (
          <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-400 dark:border-neutral-800">
            Select an annotation to edit its properties, or pick a tool above and click/drag on the page.
          </p>
        )}
      </div>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof MousePointer2;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
        active
          ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
          : "border-neutral-200 dark:border-neutral-800"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function AnnotationView({
  ann,
  selected,
  onPointerDown,
}: {
  ann: Annotation;
  selected: boolean;
  onPointerDown: (e: ReactPointerEvent) => void;
}) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${ann.xPct}%`,
    top: `${ann.yPct}%`,
    width: `${ann.wPct}%`,
    height: `${ann.hPct}%`,
    cursor: "move",
    outline: selected ? "2px solid #2563eb" : "none",
  };

  switch (ann.type) {
    case "text":
      return (
        <div
          onPointerDown={onPointerDown}
          style={{ ...style, color: ann.color, fontSize: `${ann.fontSize * 1.1}px`, lineHeight: 1.2, overflow: "hidden" }}
        >
          {ann.text}
        </div>
      );
    case "highlight":
      return <div onPointerDown={onPointerDown} style={{ ...style, backgroundColor: ann.color, opacity: 0.4 }} />;
    case "rectangle":
      return <div onPointerDown={onPointerDown} style={{ ...style, border: `2px solid ${ann.color}` }} />;
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img onPointerDown={onPointerDown} src={ann.dataUrl} alt="" style={style} />
      );
  }
}

function AnnotationProperties({
  annotation,
  onChange,
  onDelete,
}: {
  annotation: Annotation;
  onChange: (patch: Partial<Annotation>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-sm font-medium capitalize">{annotation.type}</p>

      {annotation.type === "text" && (
        <>
          <textarea
            value={annotation.text}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
          <label className="flex items-center justify-between text-xs">
            Font size
            <input
              type="number"
              min={6}
              max={96}
              value={annotation.fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              className="w-16 rounded-md border border-neutral-200 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-900"
            />
          </label>
          <label className="flex items-center justify-between text-xs">
            Color
            <input type="color" value={annotation.color} onChange={(e) => onChange({ color: e.target.value })} />
          </label>
        </>
      )}

      {(annotation.type === "rectangle" || annotation.type === "highlight") && (
        <label className="flex items-center justify-between text-xs">
          Color
          <input type="color" value={annotation.color} onChange={(e) => onChange({ color: e.target.value })} />
        </label>
      )}

      <Button variant="outline" size="sm" onClick={onDelete}>
        <Trash2 size={14} />
        Delete
      </Button>
    </div>
  );
}
