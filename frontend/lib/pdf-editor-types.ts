export type AnnotationType = "text" | "highlight" | "rectangle" | "image";

interface BaseAnnotation {
  id: string;
  page: number; // 0-based
  /** All geometry is a percentage of the page box, top-left origin (0,0), y down. */
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  text: string;
  fontSize: number; // pt, at the PDF's native page size
  color: string; // hex
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: "rectangle" | "highlight";
  color: string; // hex
}

export interface ImageAnnotation extends BaseAnnotation {
  type: "image";
  dataUrl: string;
}

export type Annotation = TextAnnotation | ShapeAnnotation | ImageAnnotation;

export const DEFAULT_TEXT_COLOR = "#111827";
export const DEFAULT_SHAPE_COLOR = "#ef4444";
export const DEFAULT_HIGHLIGHT_COLOR = "#fde047";
