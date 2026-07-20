export type ToolStatus = "available" | "coming-soon";

export interface Tool {
  slug: string;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  status: ToolStatus;
}

export interface ToolCategory {
  name: string;
  tools: Tool[];
}

export const CATEGORIES: ToolCategory[] = [
  {
    name: "Organize PDF",
    tools: [
      { slug: "merge-pdf", name: "Merge PDF", description: "Combine multiple PDFs into one document.", icon: "Layers", status: "available" },
      { slug: "split-pdf", name: "Split PDF", description: "Extract selected pages or split every page.", icon: "Scissors", status: "available" },
      { slug: "organize-pdf", name: "Organize PDF", description: "Delete, reorder, or duplicate pages.", icon: "ListOrdered", status: "available" },
      { slug: "rotate-pdf", name: "Rotate PDF", description: "Rotate selected pages to the correct orientation.", icon: "RotateCw", status: "available" },
      { slug: "crop-pdf", name: "Crop PDF", description: "Crop margins or selected pages.", icon: "Crop", status: "coming-soon" },
      { slug: "page-numbers", name: "Page Numbers", description: "Add customizable page numbers.", icon: "Hash", status: "coming-soon" },
    ],
  },
  {
    name: "Optimize PDF",
    tools: [
      { slug: "compress-pdf", name: "Compress PDF", description: "Reduce file size with extreme, recommended, or low compression.", icon: "Minimize2", status: "available" },
      { slug: "repair-pdf", name: "Repair PDF", description: "Fix corrupted PDFs and recover readable pages.", icon: "Wrench", status: "coming-soon" },
      { slug: "pdf-to-pdfa", name: "PDF/A Conversion", description: "Convert PDFs into archival PDF/A format.", icon: "Archive", status: "coming-soon" },
    ],
  },
  {
    name: "Convert PDF",
    tools: [
      { slug: "pdf-to-word", name: "PDF to Word", description: "Convert PDF to editable DOCX.", icon: "FileText", status: "available" },
      { slug: "pdf-to-excel", name: "PDF to Excel", description: "Convert PDF to XLSX.", icon: "Sheet", status: "available" },
      { slug: "pdf-to-powerpoint", name: "PDF to PowerPoint", description: "Convert PDF to PPTX.", icon: "Presentation", status: "available" },
      { slug: "word-to-pdf", name: "Word to PDF", description: "Convert DOCX to PDF.", icon: "FileText", status: "available" },
      { slug: "excel-to-pdf", name: "Excel to PDF", description: "Convert XLSX to PDF.", icon: "Sheet", status: "available" },
      { slug: "powerpoint-to-pdf", name: "PowerPoint to PDF", description: "Convert PPTX to PDF.", icon: "Presentation", status: "available" },
      { slug: "pdf-to-jpg", name: "PDF to JPG", description: "Convert PDF pages into images.", icon: "Image", status: "available" },
      { slug: "jpg-to-pdf", name: "JPG to PDF", description: "Convert images into a PDF document.", icon: "ImagePlus", status: "available" },
      { slug: "pdf-to-html", name: "PDF to HTML", description: "Convert PDF into an HTML page.", icon: "Code2", status: "available" },
      { slug: "pdf-to-markdown", name: "PDF to Markdown", description: "Convert PDF into Markdown.", icon: "FileCode", status: "available" },
    ],
  },
  {
    name: "Edit PDF",
    tools: [
      { slug: "edit-pdf", name: "Edit PDF", description: "Add text, images, shapes, highlights, and annotations.", icon: "Pencil", status: "coming-soon" },
      { slug: "watermark", name: "Watermark", description: "Add a text or image watermark.", icon: "Stamp", status: "available" },
      { slug: "redact-pdf", name: "Redact PDF", description: "Permanently remove sensitive text or images.", icon: "EyeOff", status: "available" },
      { slug: "pdf-forms", name: "PDF Forms", description: "Create fillable fields, checkboxes, and text inputs.", icon: "ClipboardList", status: "available" },
      { slug: "sign-pdf", name: "Sign PDF", description: "Draw, upload, or place a signature.", icon: "PenTool", status: "available" },
    ],
  },
  {
    name: "PDF Security",
    tools: [
      { slug: "protect-pdf", name: "Protect PDF", description: "Add password encryption.", icon: "Lock", status: "coming-soon" },
      { slug: "unlock-pdf", name: "Unlock PDF", description: "Remove a password you own.", icon: "Unlock", status: "coming-soon" },
      { slug: "compare-pdf", name: "Compare PDF", description: "Highlight differences between two PDFs.", icon: "GitCompare", status: "coming-soon" },
    ],
  },
  {
    name: "PDF Intelligence",
    tools: [
      { slug: "scan-to-pdf", name: "Scan to PDF", description: "Camera upload, image cleanup, and scan conversion.", icon: "ScanLine", status: "coming-soon" },
      { slug: "ocr-pdf", name: "OCR PDF", description: "Turn scanned PDFs into searchable text.", icon: "ScanText", status: "coming-soon" },
      { slug: "ai-summarizer", name: "AI PDF Summarizer", description: "Generate a summary and key points.", icon: "Sparkles", status: "coming-soon" },
      { slug: "translate-pdf", name: "Translate PDF", description: "Translate PDF text while keeping formatting.", icon: "Languages", status: "coming-soon" },
    ],
  },
];

export const ALL_TOOLS: Tool[] = CATEGORIES.flatMap((c) => c.tools);

export function getTool(slug: string): Tool | undefined {
  return ALL_TOOLS.find((t) => t.slug === slug);
}
