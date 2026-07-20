"use client";

import { useState } from "react";
import { ToolPageShell } from "@/components/tool-page-shell";
import { Uploader } from "@/components/uploader";
import { ProcessFlow } from "@/components/process-flow";
import { callTool } from "@/lib/api";

export default function JpgToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ToolPageShell title="JPG to PDF" description="Combine one or more images into a single PDF document.">
      <Uploader accept="image/jpeg,image/png" multiple files={files} onFilesChange={setFiles} label="Drag & drop images, or click to upload" />

      <div className="mt-6">
        <ProcessFlow
          canRun={files.length >= 1}
          fallbackFilename="converted.pdf"
          runLabel="Convert to PDF"
          run={() => {
            const formData = new FormData();
            files.forEach((f) => formData.append("files", f));
            return callTool("jpg-to-pdf", formData);
          }}
        />
      </div>
    </ToolPageShell>
  );
}
