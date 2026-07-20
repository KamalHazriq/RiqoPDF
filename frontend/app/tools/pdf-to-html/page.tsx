"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function PdfToHtmlPage() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolPageShell title="PDF to HTML" description="Convert a PDF into a standalone HTML page.">
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1}
          fallbackFilename="converted.html"
          runLabel="Convert to HTML"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            return callTool("pdf-to-html", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
