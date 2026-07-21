import { ToolPageShell } from "@/components/tool-page-shell";
import { PdfEditor } from "@/components/pdf-editor";

export default function EditPdfPage() {
  return (
    <ToolPageShell
      wide
      title="Edit PDF"
      description="Add text, highlights, shapes, and images directly on the page, then download. Runs entirely in your browser."
    >
      <PdfEditor />
    </ToolPageShell>
  );
}
