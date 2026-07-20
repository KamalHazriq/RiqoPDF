"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function PdfToPowerpointPage() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolPageShell title="PDF to PowerPoint" description="Convert each PDF page into a slide, preserving the original layout.">
      <Uploader accept="application/pdf" files={files} onFilesChange={setFiles} label="Drag & drop a PDF, or click to upload" />

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length === 1}
          fallbackFilename="converted.pptx"
          runLabel="Convert to PowerPoint"
          run={() => {
            const formData = new FormData();
            formData.append("file", files[0]);
            return callTool("pdf-to-powerpoint", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
